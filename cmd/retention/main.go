package main

import (
	"database/sql"
	"log/slog"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/Carlos20052030/reverse-proxy/internal/billing/domain"
	"github.com/Carlos20052030/reverse-proxy/internal/billing/retention"
)

type pgRetentionDB struct {
	db *sql.DB
}

func (p *pgRetentionDB) GetOldDeliveryAttempts(plan domain.Plan, olderThan time.Time) ([]retention.DeliveryAttempt, error) {
	planStr := plan.String()
	rows, err := p.db.Query(`
		SELECT id, user_id, plan, created_at
		FROM delivery_attempts
		WHERE plan = $1 AND created_at < $2
		ORDER BY created_at ASC
		LIMIT 1000
	`, planStr, olderThan)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attempts []retention.DeliveryAttempt
	for rows.Next() {
		var a retention.DeliveryAttempt
		if err := rows.Scan(&a.ID, &a.UserID, &a.Plan, &a.CreatedAt); err != nil {
			return nil, err
		}
		attempts = append(attempts, a)
	}
	return attempts, nil
}

func (p *pgRetentionDB) DeleteDeliveryAttempts(ids []int64) (int64, error) {
	if len(ids) == 0 {
		return 0, nil
	}

	// Build placeholders for IN clause
	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = "$" + string(rune('1'+i))
		args[i] = id
	}

	query := "DELETE FROM delivery_attempts WHERE id IN (" + join(placeholders, ",") + ")"
	result, err := p.db.Exec(query, args...)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

func join(elems []string, sep string) string {
	if len(elems) == 0 {
		return ""
	}
	result := elems[0]
	for _, e := range elems[1:] {
		result += sep + e
	}
	return result
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://bookmarks:senha_simples_local_123@localhost:5432/webhook_dispatcher?sslmode=disable"
	}

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		logger.Error("failed to ping database", "error", err)
		os.Exit(1)
	}

	retentionDB := &pgRetentionDB{db: db}
	svc := retention.NewRetentionService(retentionDB)

	now := time.Now()
	result, err := svc.CleanupAll(now)
	if err != nil {
		logger.Error("retention cleanup failed", "error", err)
		os.Exit(1)
	}

	logger.Info("retention cleanup completed",
		"deleted_free", result.DeletedFree,
		"deleted_pro", result.DeletedPro,
		"total_deleted", result.TotalDeleted,
	)
}