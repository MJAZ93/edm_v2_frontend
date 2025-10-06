# ASCApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateAscsGet**](#privateascsget) | **GET** /private/ascs | List ASCs|
|[**privateAscsIdDelete**](#privateascsiddelete) | **DELETE** /private/ascs/{id} | Delete ASC|
|[**privateAscsIdGet**](#privateascsidget) | **GET** /private/ascs/{id} | Get ASC|
|[**privateAscsIdPut**](#privateascsidput) | **PUT** /private/ascs/{id} | Update ASC|
|[**privateAscsPost**](#privateascspost) | **POST** /private/ascs | Create ASC|

# **privateAscsGet**
> AscASCListResponse privateAscsGet()

Paginated list of ASCs

### Example

```typescript
import {
    ASCApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ASCApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (-1 returns all) (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'id')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let name: string; //Filter by name (optional) (default to undefined)
let regiaoId: string; //Filter by regiao (optional) (default to undefined)

const { status, data } = await apiInstance.privateAscsGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection,
    name,
    regiaoId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **page** | [**number**] | Page number (-1 returns all) | (optional) defaults to undefined|
| **pageSize** | [**number**] | Page size | (optional) defaults to undefined|
| **orderBy** | [**string**] | Order by | (optional) defaults to 'id'|
| **orderDirection** | [**string**] | asc|desc | (optional) defaults to 'asc'|
| **name** | [**string**] | Filter by name | (optional) defaults to undefined|
| **regiaoId** | [**string**] | Filter by regiao | (optional) defaults to undefined|


### Return type

**AscASCListResponse**

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

# **privateAscsIdDelete**
> privateAscsIdDelete()


### Example

```typescript
import {
    ASCApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ASCApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateAscsIdDelete(
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

# **privateAscsIdGet**
> ModelASC privateAscsIdGet()


### Example

```typescript
import {
    ASCApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ASCApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateAscsIdGet(
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

**ModelASC**

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

# **privateAscsIdPut**
> ModelASC privateAscsIdPut(payload)


### Example

```typescript
import {
    ASCApi,
    Configuration,
    AscUpdateASCRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ASCApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: AscUpdateASCRequest; //Payload

const { status, data } = await apiInstance.privateAscsIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **AscUpdateASCRequest**| Payload | |
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelASC**

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

# **privateAscsPost**
> ModelASC privateAscsPost(payload)


### Example

```typescript
import {
    ASCApi,
    Configuration,
    AscCreateASCRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ASCApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: AscCreateASCRequest; //Payload

const { status, data } = await apiInstance.privateAscsPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **AscCreateASCRequest**| Payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelASC**

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

