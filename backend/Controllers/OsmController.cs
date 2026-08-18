using CeleoxApi.Data;
using CeleoxApi.Models;
using CeleoxApi.Services;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;

namespace CeleoxApi.Controllers;

[ApiController]
[Route("api/osm")]
public class OsmController : ControllerBase
{
    private readonly OsmService _osmService;
    private readonly MongoDbContext _mongoDbContext;

    public OsmController(
        OsmService osmService,
        MongoDbContext mongoDbContext)
    {
        _osmService = osmService;
        _mongoDbContext = mongoDbContext;
    }

    [HttpGet("info")]
    public IActionResult GetInfo()
    {
        var info = _osmService.GetInfo();

        return Ok(info);
    }

    [HttpGet("mountain")]
    public IActionResult GetMountainInfo()
    {
        var info = _osmService.GetMountainInfo();

        return Ok(info);
    }

    [HttpPost("test")]
    public async Task<IActionResult> TestMongo()
    {
        var feature = new MountainFeature
        {
            Id = "test-1",
            Type = "spring",
            Name = "Fuente de prueba",
            Latitude = 42.1234,
            Longitude = 1.2345,
            Tags = new Dictionary<string, string>
            {
                ["natural"] = "spring"
            }
        };

        await _mongoDbContext.MountainFeatures
            .ReplaceOneAsync(
                x => x.Id == feature.Id,
                feature,
                new ReplaceOptions
                {
                    IsUpsert = true
                }
            );

        return Ok(feature);
    }

    [HttpGet("mongo-test")]
    public async Task<IActionResult> TestMongoRead()
    {
        var feature = await _mongoDbContext.MountainFeatures
            .Find(x => x.Id == "test-1")
            .FirstOrDefaultAsync();

        return Ok(feature);
    }

    [HttpGet("spring-test")]
    public async Task<IActionResult> TestSpring()
    {
        var spring = _osmService.GetFirstSpring();

        if (spring == null)
            return NotFound("No se ha encontrado ninguna fuente.");

        await _mongoDbContext.MountainFeatures
            .ReplaceOneAsync(
                x => x.Id == spring.Id,
                spring,
                new ReplaceOptions
                {
                    IsUpsert = true
                }
            );

        return Ok(spring);
    }

    [HttpPost("import-springs")]
    public async Task<IActionResult> ImportSprings()
    {
        var springs = _osmService.GetSprings();

        await _mongoDbContext.UpsertMountainFeaturesAsync(springs);

        return Ok(new
        {
            count = springs.Count
        });
    }

    [HttpGet("springs")]
    public async Task<IActionResult> GetSprings(
        double minLat,
        double maxLat,
        double minLon,
        double maxLon)
    {
        var filter =
            Builders<MountainFeature>.Filter.Eq(
                x => x.Type,
                "spring"
            )
            &
            Builders<MountainFeature>.Filter.Gte(
                x => x.Latitude,
                minLat
            )
            &
            Builders<MountainFeature>.Filter.Lte(
                x => x.Latitude,
                maxLat
            )
            &
            Builders<MountainFeature>.Filter.Gte(
                x => x.Longitude,
                minLon
            )
            &
            Builders<MountainFeature>.Filter.Lte(
                x => x.Longitude,
                maxLon
            );

        var springs = await _mongoDbContext.MountainFeatures
            .Find(filter)
            .ToListAsync();

        return Ok(springs);
    }

    [HttpGet("springs/search")]
    public async Task<IActionResult> SearchSprings(
    [FromQuery] string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return Ok(new List<MountainFeature>());

        var filter =
            Builders<MountainFeature>.Filter.Eq(
                x => x.Type,
                "spring"
            )
            &
            Builders<MountainFeature>.Filter.Regex(
                x => x.Name,
                new MongoDB.Bson.BsonRegularExpression(
                    name,
                    "i"
                )
            );

        var springs = await _mongoDbContext.MountainFeatures
            .Find(filter)
            .Limit(20)
            .ToListAsync();

        return Ok(springs);
    }
}