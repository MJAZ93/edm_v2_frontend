# InstalacaoAccaoTipoApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateInstalacaoAccaoTiposGet**](#privateinstalacaoaccaotiposget) | **GET** /private/instalacao-accao-tipos | List InstalacaoAccaoTipos|
|[**privateInstalacaoAccaoTiposIdDelete**](#privateinstalacaoaccaotiposiddelete) | **DELETE** /private/instalacao-accao-tipos/{id} | Delete InstalacaoAccaoTipo|
|[**privateInstalacaoAccaoTiposIdGet**](#privateinstalacaoaccaotiposidget) | **GET** /private/instalacao-accao-tipos/{id} | Get InstalacaoAccaoTipo|
|[**privateInstalacaoAccaoTiposIdPut**](#privateinstalacaoaccaotiposidput) | **PUT** /private/instalacao-accao-tipos/{id} | Update InstalacaoAccaoTipo|
|[**privateInstalacaoAccaoTiposPost**](#privateinstalacaoaccaotipospost) | **POST** /private/instalacao-accao-tipos | Create InstalacaoAccaoTipo|

# **privateInstalacaoAccaoTiposGet**
> InstalacaoAccaoTipoInstalacaoAccaoTipoListResponse privateInstalacaoAccaoTiposGet()

Paginated list of InstalacaoAccaoTipos

### Example

```typescript
import {
    InstalacaoAccaoTipoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InstalacaoAccaoTipoApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (-1 returns all) (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'nome')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let nome: string; //Filter by name (optional) (default to undefined)

const { status, data } = await apiInstance.privateInstalacaoAccaoTiposGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection,
    nome
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **authorization** | [**string**] | Bearer token | defaults to undefined|
| **page** | [**number**] | Page number (-1 returns all) | (optional) defaults to undefined|
| **pageSize** | [**number**] | Page size | (optional) defaults to undefined|
| **orderBy** | [**string**] | Order by | (optional) defaults to 'nome'|
| **orderDirection** | [**string**] | asc|desc | (optional) defaults to 'asc'|
| **nome** | [**string**] | Filter by name | (optional) defaults to undefined|


### Return type

**InstalacaoAccaoTipoInstalacaoAccaoTipoListResponse**

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

# **privateInstalacaoAccaoTiposIdDelete**
> privateInstalacaoAccaoTiposIdDelete()


### Example

```typescript
import {
    InstalacaoAccaoTipoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InstalacaoAccaoTipoApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateInstalacaoAccaoTiposIdDelete(
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

# **privateInstalacaoAccaoTiposIdGet**
> ModelInstalacaoAccaoTipo privateInstalacaoAccaoTiposIdGet()


### Example

```typescript
import {
    InstalacaoAccaoTipoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new InstalacaoAccaoTipoApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateInstalacaoAccaoTiposIdGet(
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

**ModelInstalacaoAccaoTipo**

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

# **privateInstalacaoAccaoTiposIdPut**
> ModelInstalacaoAccaoTipo privateInstalacaoAccaoTiposIdPut(payload)


### Example

```typescript
import {
    InstalacaoAccaoTipoApi,
    Configuration,
    InstalacaoAccaoTipoUpdateInstalacaoAccaoTipoRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new InstalacaoAccaoTipoApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: InstalacaoAccaoTipoUpdateInstalacaoAccaoTipoRequest; //Payload

const { status, data } = await apiInstance.privateInstalacaoAccaoTiposIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **InstalacaoAccaoTipoUpdateInstalacaoAccaoTipoRequest**| Payload | |
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInstalacaoAccaoTipo**

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

# **privateInstalacaoAccaoTiposPost**
> ModelInstalacaoAccaoTipo privateInstalacaoAccaoTiposPost(payload)


### Example

```typescript
import {
    InstalacaoAccaoTipoApi,
    Configuration,
    InstalacaoAccaoTipoCreateInstalacaoAccaoTipoRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new InstalacaoAccaoTipoApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: InstalacaoAccaoTipoCreateInstalacaoAccaoTipoRequest; //Payload

const { status, data } = await apiInstance.privateInstalacaoAccaoTiposPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **InstalacaoAccaoTipoCreateInstalacaoAccaoTipoRequest**| Payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelInstalacaoAccaoTipo**

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

