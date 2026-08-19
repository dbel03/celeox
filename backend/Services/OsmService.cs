using OsmSharp;
using OsmSharp.Streams;
using CeleoxApi.Models;

namespace CeleoxApi.Services;

public class OsmService(IWebHostEnvironment environment)
{
    private readonly string _osmFilePath = Path.Combine(
            environment.ContentRootPath,
            "Data",
            "osm",
            "cataluna-260816.osm.pbf"
        );

    /*
     * Mapeo de nuestro "type" lógico a los tags de OpenStreetMap
     * que lo identifican. Un mismo type puede corresponder a
     * varias combinaciones tag=valor (ej. shelter -> alpine_hut
     * o wilderness_hut).
     */
    private static readonly Dictionary<string, (string TagKey, string TagValue)[]> TypeTagMap = new()
    {
        ["spring"] = [("natural", "spring")],
        ["peak"] = [("natural", "peak")],
        ["cave"] = [("natural", "cave_entrance")],
        ["drinking_water"] = [("amenity", "drinking_water")],
        ["shelter"] =
        [
            ("tourism", "alpine_hut"),
            ("tourism", "wilderness_hut"),
        ],
        ["viewpoint"] = [("tourism", "viewpoint")],
        ["campsite"] = [("tourism", "camp_site")],
        ["hospital"] = [("amenity", "hospital")],
    };

    private void EnsureFileExists()
    {
        if (!File.Exists(_osmFilePath))
        {
            throw new FileNotFoundException(
                "No se ha encontrado el fichero OSM.",
                _osmFilePath
            );
        }
    }

    public OsmInfo GetInfo()
    {
        EnsureFileExists();

        long nodes = 0;
        long ways = 0;
        long relations = 0;

        using var fileStream = File.OpenRead(_osmFilePath);

        var source = new PBFOsmStreamSource(fileStream);

        foreach (var osmGeo in source)
        {
            switch (osmGeo.Type)
            {
                case OsmGeoType.Node:
                    nodes++;
                    break;

                case OsmGeoType.Way:
                    ways++;
                    break;

                case OsmGeoType.Relation:
                    relations++;
                    break;
            }
        }

        return new OsmInfo(nodes, ways, relations);
    }

    public MountainInfo GetMountainInfo()
    {
        EnsureFileExists();

        long springs = 0;
        long caves = 0;
        long drinkingWater = 0;
        long refuges = 0;
        long viewpoints = 0;
        long peaks = 0;

        using var fileStream = File.OpenRead(_osmFilePath);

        var source = new PBFOsmStreamSource(fileStream);

        foreach (var osmGeo in source)
        {
            if (osmGeo.Tags == null)
                continue;

            if (osmGeo.Tags.TryGetValue("natural", out var natural))
            {
                switch (natural)
                {
                    case "spring":
                        springs++;
                        break;

                    case "cave_entrance":
                        caves++;
                        break;

                    case "peak":
                        peaks++;
                        break;
                }
            }

            if (osmGeo.Tags.TryGetValue("amenity", out var amenity))
            {
                if (amenity == "drinking_water")
                    drinkingWater++;
            }

            if (osmGeo.Tags.TryGetValue("tourism", out var tourism))
            {
                switch (tourism)
                {
                    case "alpine_hut":
                    case "wilderness_hut":
                        refuges++;
                        break;

                    case "viewpoint":
                        viewpoints++;
                        break;
                }
            }
        }

        return new MountainInfo(
            springs,
            caves,
            drinkingWater,
            refuges,
            viewpoints,
            peaks
        );
    }

    /*
     * Devuelve todos los tipos soportados (para validación
     * en el controller, sin duplicar la lista ahí).
     */
    public IEnumerable<string> GetSupportedTypes()
    {
        return TypeTagMap.Keys;
    }

    /*
     * Recorre el extracto OSM y devuelve todos los nodos
     * que coincidan con el type solicitado.
     */
    public List<MountainFeature> GetFeaturesByType(string type)
    {
        EnsureFileExists();

        if (!TypeTagMap.TryGetValue(type, out var tagMatchers))
        {
            throw new ArgumentException(
                $"Tipo no soportado: {type}"
            );
        }

        var features = new List<MountainFeature>();

        using var fileStream = File.OpenRead(_osmFilePath);

        var source = new PBFOsmStreamSource(fileStream);

        foreach (var osmGeo in source)
        {
            if (osmGeo.Tags == null)
                continue;

            if (osmGeo is not Node node)
                continue;

            var matches = tagMatchers.Any(matcher =>
                osmGeo.Tags.TryGetValue(matcher.TagKey, out var value)
                && value == matcher.TagValue
            );

            if (!matches)
                continue;

            features.Add(new MountainFeature
            {
                Id = node.Id?.ToString() ?? string.Empty,
                Type = type,
                Name = node.Tags.TryGetValue("name", out var name)
                    ? name
                    : null,
                Latitude = node.Latitude ?? 0,
                Longitude = node.Longitude ?? 0,
                Tags = node.Tags.ToDictionary(
                    x => x.Key,
                    x => x.Value
                )
            });
        }

        return features;
    }
}

public record OsmInfo(
    long Nodes,
    long Ways,
    long Relations
);

public record MountainInfo(
    long Springs,
    long Caves,
    long DrinkingWater,
    long Refuges,
    long Viewpoints,
    long Peaks
);