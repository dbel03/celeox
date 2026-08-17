using OsmSharp;
using OsmSharp.Streams;

namespace CeleoxApi.Services;

public class OsmService
{
    private readonly string _osmFilePath;

    public OsmService(IWebHostEnvironment environment)
    {
        _osmFilePath = Path.Combine(
            environment.ContentRootPath,
            "Data",
            "osm",
            "cataluna-260816.osm.pbf"
        );
    }

    public OsmInfo GetInfo()
    {
        if (!File.Exists(_osmFilePath))
        {
            throw new FileNotFoundException(
                "No se ha encontrado el fichero OSM.",
                _osmFilePath
            );
        }

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

        return new OsmInfo(
            nodes,
            ways,
            relations
        );
    }

    public MountainInfo GetMountainInfo()
    {
        if (!File.Exists(_osmFilePath))
        {
            throw new FileNotFoundException(
                "No se ha encontrado el fichero OSM.",
                _osmFilePath
            );
        }

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