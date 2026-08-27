using CeleoxApi.Services;
using CeleoxApi.Configuration;
using CeleoxApi.Data;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// Servicios
builder.Services.AddSingleton<OsmService>();
builder.Services.AddSingleton<MountainRouteService>();
builder.Services.AddSingleton<BackblazeService>();
builder.Services.AddSingleton<MongoDbContext>();
builder.Services.AddSingleton<RoutingService>();
builder.Services.AddScoped<MountainFeatureService>();

// OpenAPI
builder.Services.AddOpenApi();

// MongoDB
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDB")
);


// Backblaze B2
builder.Services.Configure<BackblazeSettings>(
    builder.Configuration.GetSection("Backblaze")
);


builder.Services.AddHttpClient();

var app = builder.Build();

try
{
    var routingService = app.Services.GetRequiredService<RoutingService>();
    var httpClient = app.Services.GetRequiredService<IHttpClientFactory>().CreateClient();
    await routingService.LoadAsync(httpClient);

    Console.WriteLine("RouterDb cargado correctamente.");
}
catch (Exception ex)
{
    Console.WriteLine($"AVISO: ROUTERDB NO DISPONIBLE. Motivo: {ex.Message}");
}

// HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();

app.MapFallbackToFile("index.html");

app.Run();