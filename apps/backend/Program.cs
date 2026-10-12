using System.Text.Json;
using DateTimeChecker.Api.Models;
using DateTimeChecker.Api.Services;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 16 * 1024);
builder.Services.AddSingleton<DateChecker>();

var app = builder.Build();
var jsonOptions = new JsonSerializerOptions(JsonSerializerDefaults.Web);

app.MapGet("/api/health", () => Results.Ok(new { status = "ok", application = "Date Time Checker" }));
app.MapPost("/api/date/check", async Task<IResult> (HttpContext context, DateChecker checker) =>
{
    if (!context.Request.HasJsonContentType())
    {
        return Results.Json(new { outcome = "request_error", message = "Content-Type must be application/json." },
            statusCode: StatusCodes.Status415UnsupportedMediaType);
    }

    CheckDateRequest? request;
    try
    {
        request = await JsonSerializer.DeserializeAsync<CheckDateRequest>(
            context.Request.Body, jsonOptions, context.RequestAborted);
    }
    catch (JsonException)
    {
        return Results.Json(new { outcome = "request_error", message = "Use a JSON object with day, month and year as strings." },
            statusCode: StatusCodes.Status400BadRequest);
    }

    if (request is null)
    {
        return Results.Json(new { outcome = "request_error", message = "Request body must be a JSON object." },
            statusCode: StatusCodes.Status400BadRequest);
    }

    var result = checker.Check(request);
    return Results.Json(result, statusCode: result.Outcome == "validation_error"
        ? StatusCodes.Status422UnprocessableEntity : StatusCodes.Status200OK);
});

// Source checkout: apps/web. Published package: wwwroot.
var sourceWeb = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "web"));
var publishedWeb = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var webRoot = Directory.Exists(Path.Combine(sourceWeb, "assets")) ? sourceWeb : publishedWeb;
if (Directory.Exists(webRoot))
{
    var provider = new PhysicalFileProvider(webRoot);
    app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = provider });
    app.UseStaticFiles(new StaticFileOptions { FileProvider = provider });
}

app.Run();
