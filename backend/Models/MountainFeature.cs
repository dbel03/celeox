using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CeleoxApi.Models;

public class MountainFeature
{
    [BsonId]
    public string Id { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string? Name { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public Dictionary<string, string>? Tags { get; set; }
}