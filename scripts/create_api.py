from .utils import get_boto3_session, read_confirm_config

CONFIG_PATH = "scripts/config.json"


class Creator:
    def __init__(self, config_path="scripts/config.json"):
        self.config = read_confirm_config(config_path)
        if self.config is None:
            raise ValueError(
                f"Config file not found at {config_path}. Please run update_config.py first."
            )

        self.session = get_boto3_session(self.config)
        self.apigateway = self.session.client("apigatewayv2")

    def create_api(self):
        # Search for existing HTTP APIs
        response = self.apigateway.get_apis()
        api_id = None
        for api in response["Items"]:
            if api["Name"] == self.config["frontend_api_name"]:
                if api_id is not None:
                    print(
                        f"API with name {self.config['frontend_api_name']} already exists, deleting id {api['id']}."
                    )
                    self.apigateway.delete_api(ApiId=api["ApiId"])
                else:
                    api_id = api["ApiId"]

        # If the API is not found, create it
        if api_id is None:
            # Create a new HTTP API
            response = self.apigateway.create_api(
                Name=self.config["frontend_api_name"],
                ProtocolType="HTTP",
            )
            api_id = response["ApiId"]
        return api_id

    def create_route(self, api_id, route_key, integration_id=None):
        # Search for existing routes
        responses = self.apigateway.get_routes(
            ApiId=api_id,
        )
        route_id = None
        for route in responses["Items"]:
            if route["RouteKey"] == route_key:
                if route_id is not None:
                    print(
                        f"Route with key {route_key} already exists, deleting id {route['id']}."
                    )
                    self.apigateway.delete_route(
                        ApiId=api_id,
                        RouteId=route["RouteId"],
                    )
                else:
                    route_id = route["RouteId"]
        # Create a new route if not found
        if route_id is None:
            # Create a new route
            print(f"Route with key {route_key} not found, creating a new one.")
            response = self.apigateway.create_route(
                ApiId=api_id,
                RouteKey=route_key,
            )
            route_id = response["RouteId"]
        # Update the route with the integration ID if provided
        if integration_id is not None:
            self.apigateway.update_route(
                ApiId=api_id,
                RouteId=route_id,
                Target=f"integrations/{integration_id}",
            )
        return route_id

    def create_integration(self, api_id, httpMethod, uri):
        # Search for existing integrations
        responses = self.apigateway.get_integrations(
            ApiId=api_id,
        )
        integration_id = None
        for integration in responses["Items"]:
            if (
                integration["IntegrationUri"] == uri
                and integration["IntegrationMethod"] == httpMethod
            ):
                if integration_id is not None:
                    print(
                        f"Integration with URI {uri} already exists, deleting id {integration['IntegrationId']}."
                    )
                    self.apigateway.delete_integration(
                        ApiId=api_id,
                        IntegrationId=integration["IntegrationId"],
                    )
                else:
                    integration_id = integration["IntegrationId"]
        # Create an integration with the S3 bucket if not found
        if integration_id is None:
            # Create a new integration
            print(f"Integration with URI {uri} not found, creating a new one.")
            response = self.apigateway.create_integration(
                ApiId=api_id,
                IntegrationType="HTTP_PROXY",
                IntegrationMethod=httpMethod,
                IntegrationUri=uri,
                PayloadFormatVersion="1.0",
            )
            integration_id = response["IntegrationId"]
        return integration_id

    def run(self):
        frontend_api = self.create_api()
        print(f"API ID: {frontend_api}")

        root_route_id = self.create_route(frontend_api, "ANY /")
        print(f"Root Route ID: {root_route_id}")

        integration_id = self.create_integration(
            frontend_api,
            httpMethod="ANY",
            uri=f"http://{self.config['s3_bucket']}.s3-website-{self.config['aws_region']}.amazonaws.com/{{key}}",
        )
        print(f"Integration ID: {integration_id}")

        key_route_id = self.create_route(
            frontend_api, "ANY /{key}", integration_id=integration_id
        )
        print(f"Key Route ID: {key_route_id}")

        invoke_url = self.apigateway.get_api(
            ApiId=frontend_api,
        )["ApiEndpoint"]
        print(f"Invoke URL: {invoke_url}")


if __name__ == "__main__":
    creator = Creator()
    creator.run()
