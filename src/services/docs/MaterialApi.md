# MaterialApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateMateriaisGet**](#privatemateriaisget) | **GET** /private/materiais | List Materiais|
|[**privateMateriaisIdDelete**](#privatemateriaisiddelete) | **DELETE** /private/materiais/{id} | Delete Material|
|[**privateMateriaisIdGet**](#privatemateriaisidget) | **GET** /private/materiais/{id} | Get Material|
|[**privateMateriaisIdPut**](#privatemateriaisidput) | **PUT** /private/materiais/{id} | Update Material|
|[**privateMateriaisPost**](#privatemateriaispost) | **POST** /private/materiais | Create Material|

# **privateMateriaisGet**
> MaterialMaterialListResponse privateMateriaisGet()

Paginated list of Materiais

### Example

```typescript
import {
    MaterialApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new MaterialApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'id')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let scrapyardId: string; //Filter by scrapyard (optional) (default to undefined)
let sectorId: string; //Filter by sector (optional) (default to undefined)
let name: string; //Filter by name (optional) (default to undefined)

const { status, data } = await apiInstance.privateMateriaisGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection,
    scrapyardId,
    sectorId,
    name
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
| **scrapyardId** | [**string**] | Filter by scrapyard | (optional) defaults to undefined|
| **sectorId** | [**string**] | Filter by sector | (optional) defaults to undefined|
| **name** | [**string**] | Filter by name | (optional) defaults to undefined|


### Return type

**MaterialMaterialListResponse**

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

# **privateMateriaisIdDelete**
> privateMateriaisIdDelete()


### Example

```typescript
import {
    MaterialApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new MaterialApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateMateriaisIdDelete(
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

# **privateMateriaisIdGet**
> ModelMaterial privateMateriaisIdGet()


### Example

```typescript
import {
    MaterialApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new MaterialApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateMateriaisIdGet(
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

**ModelMaterial**

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

# **privateMateriaisIdPut**
> ModelMaterial privateMateriaisIdPut(payload)


### Example

```typescript
import {
    MaterialApi,
    Configuration,
    MaterialUpdateMaterialRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new MaterialApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: MaterialUpdateMaterialRequest; //Payload

const { status, data } = await apiInstance.privateMateriaisIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **MaterialUpdateMaterialRequest**| Payload | |
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelMaterial**

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

# **privateMateriaisPost**
> ModelMaterial privateMateriaisPost(payload)


### Example

```typescript
import {
    MaterialApi,
    Configuration,
    MaterialCreateMaterialRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new MaterialApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: MaterialCreateMaterialRequest; //Payload

const { status, data } = await apiInstance.privateMateriaisPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **MaterialCreateMaterialRequest**| Payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelMaterial**

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

