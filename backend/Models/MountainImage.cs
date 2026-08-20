using MongoDB.Bson.Serialization.Attributes;

namespace CeleoxApi.Models;

public class MountainImage
{
    [BsonElement("Id")]
    public string Id { get; set; } = string.Empty;

    [BsonElement("ImageKey")]
    public string ImageKey { get; set; } = string.Empty;

    [BsonElement("FileName")]
    public string FileName { get; set; } = string.Empty;
}