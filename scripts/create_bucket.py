import json

from .utils import get_boto3_session, read_confirm_config

CONFIG_PATH = "scripts/config.json"


def main():
    config = read_confirm_config(CONFIG_PATH)
    if config is None:
        return

    session = get_boto3_session(config)
    s3 = session.client("s3")

    # Check if the bucket already exists
    is_bucket_exists = False
    try:
        s3.head_bucket(Bucket=config["s3_bucket"])
        print(f"Bucket {config['s3_bucket']} already exists.")
        is_bucket_exists = True
    except Exception as e:
        print(f"Bucket {config['s3_bucket']} does not exist. Creating...")

    # Create the bucket if it doesn't exist
    if not is_bucket_exists:
        try:
            if config["aws_region"] == "us-east-1":
                # For us-east-1, we don't need to specify the location constraint
                s3.create_bucket(Bucket=config["s3_bucket"])
            else:
                # For other regions, we need to specify the location constraint
                s3.create_bucket(
                    Bucket=config["s3_bucket"],
                    CreateBucketConfiguration={
                        "LocationConstraint": config["aws_region"]
                    },
                )
            print(f"Bucket {config['s3_bucket']} created successfully.")
        except Exception as e:
            print(f"Error creating bucket: {e}")

    # Set website configuration
    try:
        s3.put_bucket_website(
            Bucket=config["s3_bucket"],
            WebsiteConfiguration={
                "ErrorDocument": {"Key": "index.html"},
                "IndexDocument": {"Suffix": "index.html"},
            },
        )
        print(f"Bucket {config['s3_bucket']} configured for website hosting.")
    except Exception as e:
        print(f"Error configuring bucket {config['s3_bucket']}: {e}")
        return

    # Put public read access
    try:
        s3.put_public_access_block(
            Bucket=config["s3_bucket"],
            PublicAccessBlockConfiguration={
                "BlockPublicAcls": False,
                "IgnorePublicAcls": False,
                "BlockPublicPolicy": False,
                "RestrictPublicBuckets": False,
            },
        )
        print(f"Public access block configuration set for {config['s3_bucket']}.")
    except Exception as e:
        print(f"Error setting public access block configuration: {e}")
        return

    # Set bucket policy
    try:
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": f"arn:aws:s3:::{config['s3_bucket']}/*",
                }
            ],
        }
        s3.put_bucket_policy(
            Bucket=config["s3_bucket"],
            Policy=json.dumps(bucket_policy),
        )
        print(f"Bucket policy set for {config['s3_bucket']}.")
    except Exception as e:
        print(f"Error setting bucket policy: {e}")


if __name__ == "__main__":
    main()
