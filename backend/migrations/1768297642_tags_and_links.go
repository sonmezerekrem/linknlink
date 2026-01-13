package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

func init() {
	m.Register(func(app core.App) error {

		// Get users collection ID
		usersCollection, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}
		usersCollectionId := usersCollection.Id

		// Create Tags collection
		tagsCollection, err := app.FindCollectionByNameOrId("tags")
		if err != nil {
			tagsCollection = core.NewBaseCollection("tags")
			tagsCollection.Fields.Add(
				&core.AutodateField{
					Name:     "created",
					OnCreate: true,
				},
				&core.AutodateField{
					Name:     "updated",
					OnCreate: true,
					OnUpdate: true,
				},
				&core.TextField{
					Name:     "name",
					Required: true,
					Max:      100,
				},
				&core.TextField{
					Name:     "color",
					Required: true,
					Max:      100,
				},
				&core.RelationField{
					Name:          "user",
					System:        false,
					Hidden:        false,
					Presentable:   false,
					CollectionId:  usersCollectionId,
					CascadeDelete: true,
					MinSelect:     0,
					MaxSelect:     1,
					Required:      true,
				},
			)

			tagsCollection.ListRule = types.Pointer("@request.auth.id != '' && user = @request.auth.id")
			tagsCollection.ViewRule = types.Pointer("@request.auth.id != '' && user = @request.auth.id")
			tagsCollection.CreateRule = types.Pointer("@request.auth.id != '' && user = @request.auth.id")
			tagsCollection.UpdateRule = types.Pointer("@request.auth.id != '' && user = @request.auth.id")
			tagsCollection.DeleteRule = types.Pointer("@request.auth.id != '' && user = @request.auth.id")

			if err := app.Save(tagsCollection); err != nil {
				return err
			}
		}
		tagsCollectionId := tagsCollection.Id

		linksCollection, err := app.FindCollectionByNameOrId("links")
		if err != nil {
			linksCollection = core.NewBaseCollection("links")
			linksCollection.Fields.Add(
				&core.URLField{
					Name:     "url",
					Required: true,
				},
				&core.TextField{
					Name:     "title",
					Required: false,
					Max:      1000,
				},
				&core.TextField{
					Name:     "description",
					Required: false,
					Max:      5000,
				},
				&core.URLField{
					Name:     "og_image",
					Required: false,
				},
				&core.TextField{
					Name:     "og_site_name",
					Required: false,
					Max:      200,
				},
				&core.TextField{
					Name:     "og_type",
					Required: false,
					Max:      100,
				},
				&core.TextField{
					Name:     "favicon",
					Required: false,
					Max:      200,
				},
				&core.TextField{
					Name:     "notes",
					Required: false,
					Max:      5000,
				},
				&core.RelationField{
					Name:          "tags",
					System:        false,
					Hidden:        false,
					Presentable:   false,
					CollectionId:  tagsCollectionId,
					CascadeDelete: false,
					MinSelect:     0,
					MaxSelect:     100,
					Required:      false,
				},
				&core.RelationField{
					Name:          "user",
					System:        false,
					Hidden:        false,
					Presentable:   false,
					CollectionId:  usersCollectionId,
					CascadeDelete: true,
					MinSelect:     0,
					MaxSelect:     1,
					Required:      true,
				},
				&core.BoolField{
					Name:     "is_favorite",
					Required: false,
				},
				&core.BoolField{
					Name:     "archived",
					Required: false,
				},
			)

			linksCollection.ListRule = types.Pointer("@request.auth.id != '' && user = @request.auth.id")
			linksCollection.ViewRule = types.Pointer("@request.auth.id != '' && user = @request.auth.id")
			linksCollection.CreateRule = types.Pointer("@request.auth.id != '' && user = @request.auth.id")
			linksCollection.UpdateRule = types.Pointer("@request.auth.id != '' && user = @request.auth.id")
			linksCollection.DeleteRule = types.Pointer("@request.auth.id != '' && user = @request.auth.id")

			if err := app.Save(linksCollection); err != nil {
				return err
			}
		}

		return nil
	}, func(app core.App) error {

		// Delete links collection
		linksCollection, err := app.FindCollectionByNameOrId("links")
		if err == nil {
			if err := app.Delete(linksCollection); err != nil {
				return err
			}
		}

		// Delete tags collection
		tagsCollection, err := app.FindCollectionByNameOrId("tags")
		if err == nil {
			if err := app.Delete(tagsCollection); err != nil {
				return err
			}
		}

		return nil
	})
}
