package migrations

import (
	"os"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		// Get admin credentials from environment variables or use defaults
		adminEmail := os.Getenv("POCKETBASE_ADMIN_EMAIL")
		if adminEmail == "" {
			adminEmail = "admin@example.com"
		}

		adminPassword := os.Getenv("POCKETBASE_ADMIN_PASSWORD")
		if adminPassword == "" {
			adminPassword = "admin123456789"
		}

		superusers, err := app.FindCollectionByNameOrId(core.CollectionNameSuperusers)
		if err != nil {
			return err
		}

		record := core.NewRecord(superusers)
		record.Set("email", adminEmail)
		record.Set("password", adminPassword)

		return app.Save(record)
	}, func(app core.App) error {
		// Rollback: delete the admin user
		adminEmail := os.Getenv("POCKETBASE_ADMIN_EMAIL")
		if adminEmail == "" {
			adminEmail = "admin@example.com"
		}

		record, _ := app.FindAuthRecordByEmail(core.CollectionNameSuperusers, adminEmail)
		if record == nil {
			return nil // probably already deleted
		}

		return app.Delete(record)
	})
}
