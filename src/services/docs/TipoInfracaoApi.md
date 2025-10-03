# TipoInfracaoApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateTiposInfracaoGet**](#privatetiposinfracaoget) | **GET** /private/tipos_infracao | List Tipos de Infração|
|[**privateTiposInfracaoIdDelete**](#privatetiposinfracaoiddelete) | **DELETE** /private/tipos_infracao/{id} | Delete Tipo de Infração|
|[**privateTiposInfracaoIdGet**](#privatetiposinfracaoidget) | **GET** /private/tipos_infracao/{id} | Get Tipo de Infração|
|[**privateTiposInfracaoIdPut**](#privatetiposinfracaoidput) | **PUT** /private/tipos_infracao/{id} | Update Tipo de Infração|
|[**privateTiposInfracaoPost**](#privatetiposinfracaopost) | **POST** /private/tipos_infracao | Create Tipo de Infração|

# **privateTiposInfracaoGet**
> TipoInfracaoTipoInfracaoListResponse privateTiposInfracaoGet()

Paginated list of TipoInfracao

### Example

```typescript
import {
    TipoInfracaoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TipoInfracaoApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'id')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let name: string; //Filter by name (optional) (default to undefined)

const { status, data } = await apiInstance.privateTiposInfracaoGet(
    authorization,
    page,
    pageSize,
    orderBy,
    orderDirection,
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
| **name** | [**string**] | Filter by name | (optional) defaults to undefined|


### Return type

**TipoInfracaoTipoInfracaoListResponse**

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

# **privateTiposInfracaoIdDelete**
> privateTiposInfracaoIdDelete()


### Example

```typescript
import {
    TipoInfracaoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TipoInfracaoApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateTiposInfracaoIdDelete(
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

# **privateTiposInfracaoIdGet**
> ModelTipoInfracao privateTiposInfracaoIdGet()


### Example

```typescript
import {
    TipoInfracaoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new TipoInfracaoApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateTiposInfracaoIdGet(
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

**ModelTipoInfracao**

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

# **privateTiposInfracaoIdPut**
> ModelTipoInfracao privateTiposInfracaoIdPut(payload)


### Example

```typescript
import {
    TipoInfracaoApi,
    Configuration,
    TipoInfracaoUpdateTipoInfracaoRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TipoInfracaoApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: TipoInfracaoUpdateTipoInfracaoRequest; //Payload

const { status, data } = await apiInstance.privateTiposInfracaoIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **TipoInfracaoUpdateTipoInfracaoRequest**| Payload | |
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelTipoInfracao**

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

# **privateTiposInfracaoPost**
> ModelTipoInfracao privateTiposInfracaoPost(payload)


### Example

```typescript
import {
    TipoInfracaoApi,
    Configuration,
    TipoInfracaoCreateTipoInfracaoRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new TipoInfracaoApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: TipoInfracaoCreateTipoInfracaoRequest; //Payload

const { status, data } = await apiInstance.privateTiposInfracaoPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **TipoInfracaoCreateTipoInfracaoRequest**| Payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelTipoInfracao**

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

