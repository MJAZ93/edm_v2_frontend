# ScrapyardApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateScrapyardsGet**](#privatescrapyardsget) | **GET** /private/scrapyards | List Scrapyards|
|[**privateScrapyardsIdDelete**](#privatescrapyardsiddelete) | **DELETE** /private/scrapyards/{id} | Delete Scrapyard|
|[**privateScrapyardsIdGet**](#privatescrapyardsidget) | **GET** /private/scrapyards/{id} | Get Scrapyard|
|[**privateScrapyardsIdPut**](#privatescrapyardsidput) | **PUT** /private/scrapyards/{id} | Update Scrapyard|
|[**privateScrapyardsPost**](#privatescrapyardspost) | **POST** /private/scrapyards | Create Scrapyard|

# **privateScrapyardsGet**
> ScrapyardScrapyardListResponse privateScrapyardsGet()

Paginated list of Scrapyards

### Example

```typescript
import {
    ScrapyardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ScrapyardApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'id')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let ascId: string; //Filter by ASC (optional) (default to undefined)
let nome: string; //Filter by name (optional) (default to undefined)
let materialId: string; //Filter by material (optional) (default to undefined)
let nivelMin: number; //Min confidence (optional) (default to undefined)
let lat: number; //Latitude (optional) (default to undefined)
let _long: number; //Longitude (optional) (default to undefined)
let raioKm: number; //Radius kilometers (optional) (default to undefined)

const { status, data } = await apiInstance.privateScrapyardsGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection,
    ascId,
    nome,
    materialId,
    nivelMin,
    lat,
    _long,
    raioKm
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **page** | [**number**] | Page number | (optional) defaults to undefined|
| **pageSize** | [**number**] | Page size | (optional) defaults to undefined|
| **orderBy** | [**string**] | Order by | (optional) defaults to 'id'|
| **orderDirection** | [**string**] | asc|desc | (optional) defaults to 'asc'|
| **ascId** | [**string**] | Filter by ASC | (optional) defaults to undefined|
| **nome** | [**string**] | Filter by name | (optional) defaults to undefined|
| **materialId** | [**string**] | Filter by material | (optional) defaults to undefined|
| **nivelMin** | [**number**] | Min confidence | (optional) defaults to undefined|
| **lat** | [**number**] | Latitude | (optional) defaults to undefined|
| **_long** | [**number**] | Longitude | (optional) defaults to undefined|
| **raioKm** | [**number**] | Radius kilometers | (optional) defaults to undefined|


### Return type

**ScrapyardScrapyardListResponse**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**401** | Unauthorized |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateScrapyardsIdDelete**
> privateScrapyardsIdDelete()


### Example

```typescript
import {
    ScrapyardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ScrapyardApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateScrapyardsIdDelete(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | No Content |  -  |
|**401** | Unauthorized |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateScrapyardsIdGet**
> ModelScrapyard privateScrapyardsIdGet()


### Example

```typescript
import {
    ScrapyardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ScrapyardApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateScrapyardsIdGet(
    id,
    authorization
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelScrapyard**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**401** | Unauthorized |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateScrapyardsIdPut**
> ModelScrapyard privateScrapyardsIdPut(payload)


### Example

```typescript
import {
    ScrapyardApi,
    Configuration,
    ScrapyardUpdateScrapyardRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ScrapyardApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: ScrapyardUpdateScrapyardRequest; //Payload

const { status, data } = await apiInstance.privateScrapyardsIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **ScrapyardUpdateScrapyardRequest**| Payload | |
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelScrapyard**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **privateScrapyardsPost**
> ModelScrapyard privateScrapyardsPost(payload)


### Example

```typescript
import {
    ScrapyardApi,
    Configuration,
    ScrapyardCreateScrapyardRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ScrapyardApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: ScrapyardCreateScrapyardRequest; //Payload

const { status, data } = await apiInstance.privateScrapyardsPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **ScrapyardCreateScrapyardRequest**| Payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelScrapyard**

### Authorization

[BearerAuth](../README.md#BearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Created |  -  |
|**400** | Bad Request |  -  |
|**401** | Unauthorized |  -  |
|**409** | Conflict |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

