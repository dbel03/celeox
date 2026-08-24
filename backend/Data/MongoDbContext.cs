using CeleoxApi.Configuration;
using CeleoxApi.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace CeleoxApi.Data;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(
        IOptions<MongoDbSettings> settings)
    {
        var client = new MongoClient(
            settings.Value.ConnectionString
        );

        _database = client.GetDatabase(
            settings.Value.DatabaseName
        );
    }

    public IMongoCollection<MountainFeature> MountainFeatures =>
        _database.GetCollection<MountainFeature>(
            "mountain_features"
        );

    public IMongoCollection<MountainRoute> MountainRoutes =>
        _database.GetCollection<MountainRoute>(
            "mountain_routes"
        );
}