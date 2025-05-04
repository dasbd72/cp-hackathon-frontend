import subprocess

import boto3
import boto3.session

from .utils import read_confirm_config

CONFIG_PATH = "scripts/config.json"


def main():
    config = read_confirm_config(CONFIG_PATH)
    if config is None:
        return

    session = boto3.session.Session(
        profile_name=config["aws_profile"],
        region_name=config["aws_region"],
    )
    s3 = session.client("s3")

    # Check if the bucket already exists
    try:
        s3.head_bucket(Bucket=config["s3_bucket"])
    except Exception as e:
        print(f"Bucket {config['s3_bucket']} does not exist.")
        return

    # Upload files to the bucket
    # sync config["website_path"] to config["s3_bucket"]
    print(
        f"Uploading files from {config['website_path']} to {config['s3_bucket']}..."
    )
    aws_cli_command = " ".join(
        [
            "aws",
            "s3",
            "sync",
            "--profile",
            config["aws_profile"],
            "--region",
            config["aws_region"],
            config["website_path"],
            f"s3://{config['s3_bucket']}",
            "--delete",
        ]
    )
    result = subprocess.run(
        aws_cli_command,
        shell=True,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"Error uploading files: {result.stderr}")
    else:
        print("Files uploaded successfully.")


if __name__ == "__main__":
    main()
