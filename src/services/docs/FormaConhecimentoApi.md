# FormaConhecimentoApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateFormaConhecimentosGet**](#privateformaconhecimentosget) | **GET** /private/forma_conhecimentos | List FormaConhecimento|
|[**privateFormaConhecimentosIdDelete**](#privateformaconhecimentosiddelete) | **DELETE** /private/forma_conhecimentos/{id} | Delete FormaConhecimento|
|[**privateFormaConhecimentosIdGet**](#privateformaconhecimentosidget) | **GET** /private/forma_conhecimentos/{id} | Get FormaConhecimento|
|[**privateFormaConhecimentosIdPut**](#privateformaconhecimentosidput) | **PUT** /private/forma_conhecimentos/{id} | Update FormaConhecimento|
|[**privateFormaConhecimentosPost**](#privateformaconhecimentospost) | **POST** /private/forma_conhecimentos | Create FormaConhecimento|

# **privateFormaConhecimentosGet**
> FormaConhecimentoFormaConhecimentoListResponse privateFormaConhecimentosGet()

Paginated list of FormaConhecimento

### Example

```typescript
import {
    FormaConhecimentoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FormaConhecimentoApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'id')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let name: string; //Filter by name (optional) (default to undefined)
let ativo: boolean; //Filter by ativo (optional) (default to undefined)

const { status, data } = await apiInstance.privateFormaConhecimentosGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection,
    name,
    ativo
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
| **name** | [**string**] | Filter by name | (optional) defaults to undefined|
| **ativo** | [**boolean**] | Filter by ativo | (optional) defaults to undefined|


### Return type

**FormaConhecimentoFormaConhecimentoListResponse**

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

# **privateFormaConhecimentosIdDelete**
> privateFormaConhecimentosIdDelete()


### Example

```typescript
import {
    FormaConhecimentoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FormaConhecimentoApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateFormaConhecimentosIdDelete(
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

# **privateFormaConhecimentosIdGet**
> ModelFormaConhecimento privateFormaConhecimentosIdGet()


### Example

```typescript
import {
    FormaConhecimentoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FormaConhecimentoApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateFormaConhecimentosIdGet(
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

**ModelFormaConhecimento**

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

# **privateFormaConhecimentosIdPut**
> ModelFormaConhecimento privateFormaConhecimentosIdPut(payload)


### Example

```typescript
import {
    FormaConhecimentoApi,
    Configuration,
    FormaConhecimentoUpdateFormaConhecimentoRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new FormaConhecimentoApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: FormaConhecimentoUpdateFormaConhecimentoRequest; //Payload

const { status, data } = await apiInstance.privateFormaConhecimentosIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **FormaConhecimentoUpdateFormaConhecimentoRequest**| Payload | |
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelFormaConhecimento**

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

# **privateFormaConhecimentosPost**
> ModelFormaConhecimento privateFormaConhecimentosPost(payload)


### Example

```typescript
import {
    FormaConhecimentoApi,
    Configuration,
    FormaConhecimentoCreateFormaConhecimentoRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new FormaConhecimentoApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: FormaConhecimentoCreateFormaConhecimentoRequest; //Payload

const { status, data } = await apiInstance.privateFormaConhecimentosPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **FormaConhecimentoCreateFormaConhecimentoRequest**| Payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelFormaConhecimento**

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

