using Amazon.S3;
using Amazon.S3.Model;
using CeleoxApi.Configuration;
using Microsoft.Extensions.Options;

namespace CeleoxApi.Services;

public class BackblazeService
{
    private readonly IAmazonS3 _s3;
    private readonly BackblazeSettings _settings;

    public BackblazeService(
        IOptions<BackblazeSettings> settings)
    {
        _settings = settings.Value;

        _s3 = new AmazonS3Client(
            _settings.KeyId,
            _settings.ApplicationKey,
            new AmazonS3Config
            {
                ServiceURL = _settings.ServiceUrl,
                ForcePathStyle = true
            }
        );
    }

    public async Task UploadAsync(
        Stream stream,
        string objectKey,
        string contentType)
    {
        var request = new PutObjectRequest
        {
            BucketName = _settings.BucketName,
            Key = objectKey,
            InputStream = stream,
            ContentType = contentType
        };

        await _s3.PutObjectAsync(request);
    }

    public string GetTemporaryUrl(
        string objectKey,
        int expirationMinutes = 60)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _settings.BucketName,
            Key = objectKey,
            Expires = DateTime.UtcNow.AddMinutes(
                expirationMinutes
            )
        };

        return _s3.GetPreSignedURL(request);
    }

    public async Task DeleteAsync(string objectKey)
    {
        var versionsResponse = await _s3.ListVersionsAsync(
            new ListVersionsRequest
            {
                BucketName = _settings.BucketName,
                Prefix = objectKey
            }
        );
        
        var versionsToDelete = versionsResponse.Versions?
            .Where(v => v.Key == objectKey)
            .ToList() ?? [];

        if (versionsToDelete.Count == 0)
        {
            return;
        }

        foreach (var version in versionsToDelete)
        {
            await _s3.DeleteObjectAsync(
                new DeleteObjectRequest
                {
                    BucketName = _settings.BucketName,
                    Key = objectKey,
                    VersionId = version.VersionId
                }
            );
        }
    }
}