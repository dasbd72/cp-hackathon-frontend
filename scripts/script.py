import argparse
import subprocess

from .utils import read_config

CONFIG_PATH = "scripts/config.json"


class Args:
    command: str = None
    configuration: str = "development"


def parse_args():
    parser = argparse.ArgumentParser(description="Script to run commands")
    parser.add_argument(
        "command", type=str, help="Command to run", choices=["serve", "deploy"]
    )
    parser.add_argument(
        "--configuration",
        type=str,
        help="Configuration to use",
        choices=["development", "production"],
        default="development",
    )
    args = parser.parse_args(namespace=Args)
    return args


def run_command(cmd: str):
    print(f"Running: {cmd}")
    try:
        process = subprocess.Popen(cmd, shell=True)
        process.wait()
        if process.returncode != 0:
            print(f"Failed to run: {cmd}")
            return False
        return True
    except KeyboardInterrupt:
        print("\nInterrupted by user. Terminating subprocess...")
        process.terminate()
        process.wait()
        return False


def main():
    config = read_config(CONFIG_PATH)
    if config is None:
        print(
            "Configuration file not found. Please run update_config.py first."
        )
        return

    args = parse_args()
    if args.command == "serve":
        if args.configuration == "development":
            cmds = [
                "ng serve",
            ]
        elif args.configuration == "production":
            cmds = [
                "ng serve --configuration=production",
            ]
    elif args.command == "deploy":
        cmds = [
            "ng build --configuration=production --source-map",
            "python -m scripts.upload_bucket",
        ]
    else:
        raise NotImplementedError

    for cmd in cmds:
        if not run_command(cmd):
            break


if __name__ == "__main__":
    main()
