import { environment } from '../../environments/environment';

export class AppConstants {
  public static readonly APP_NAME = 'AdSphere';
  public static readonly API_URL = environment.apiUrl;
  public static readonly GRAPHQL_ENDPOINT = environment.graphqlUrl;
}
