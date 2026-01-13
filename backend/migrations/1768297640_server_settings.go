package migrations

import (
	"os"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {

		settings := app.Settings()

		pocketbaseDomain := os.Getenv("POCKETBASE_DOMAIN")
		if pocketbaseDomain == "" {
			pocketbaseDomain = "http://localhost:8090"
		}

		settings.Meta.AppName = "LinknLink"
		settings.Meta.AppURL = pocketbaseDomain
		settings.Logs.MaxDays = 2
		settings.Logs.LogAuthId = true
		settings.Logs.LogIP = false

		return app.Save(settings)
	}, func(app core.App) error {
		return nil
	})
}
