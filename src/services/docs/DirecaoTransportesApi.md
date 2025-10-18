# DirecaoTransportesApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateDirecaoTransportesGet**](#privatedirecaotransportesget) | **GET** /private/direcao_transportes | List DirecaoTransportes|
|[**privateDirecaoTransportesIdDelete**](#privatedirecaotransportesiddelete) | **DELETE** /private/direcao_transportes/{id} | Delete DirecaoTransportes|
|[**privateDirecaoTransportesIdGet**](#privatedirecaotransportesidget) | **GET** /private/direcao_transportes/{id} | Get DirecaoTransportes|
|[**privateDirecaoTransportesIdPut**](#privatedirecaotransportesidput) | **PUT** /private/direcao_transportes/{id} | Update DirecaoTransportes|
|[**privateDirecaoTransportesPost**](#privatedirecaotransportespost) | **POST** /private/direcao_transportes | Create DirecaoTransportes|

# **privateDirecaoTransportesGet**
> DirecaoTransportesDirecaoTransportesListResponse privateDirecaoTransportesGet()

Paginated list of DirecaoTransportes

### Example

```typescript
import {
    DirecaoTransportesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DirecaoTransportesApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (-1 returns all) (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'id')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let name: string; //Filter by name (optional) (default to undefined)

const { status, data } = await apiInstance.privateDirecaoTransportesGet(
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
| **page** | [**number**] | Page number (-1 returns all) | (optional) defaults to undefined|
| **pageSize** | [**number**] | Page size | (optional) defaults to undefined|
| **orderBy** | [**string**] | Order by | (optional) defaults to 'id'|
| **orderDirection** | [**string**] | asc|desc | (optional) defaults to 'asc'|
| **name** | [**string**] | Filter by name | (optional) defaults to undefined|


### Return type

**DirecaoTransportesDirecaoTransportesListResponse**

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

# **privateDirecaoTransportesIdDelete**
> privateDirecaoTransportesIdDelete()


### Example

```typescript
import {
    DirecaoTransportesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DirecaoTransportesApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateDirecaoTransportesIdDelete(
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

# **privateDirecaoTransportesIdGet**
> ModelDirecaoTransportes privateDirecaoTransportesIdGet()


### Example

```typescript
import {
    DirecaoTransportesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DirecaoTransportesApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateDirecaoTransportesIdGet(
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

**ModelDirecaoTransportes**

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

# **privateDirecaoTransportesIdPut**
> ModelDirecaoTransportes privateDirecaoTransportesIdPut(payload)


### Example

```typescript
import {
    DirecaoTransportesApi,
    Configuration,
    DirecaoTransportesUpdateDirecaoTransportesRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DirecaoTransportesApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: DirecaoTransportesUpdateDirecaoTransportesRequest; //Payload

const { status, data } = await apiInstance.privateDirecaoTransportesIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **DirecaoTransportesUpdateDirecaoTransportesRequest**| Payload | |
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelDirecaoTransportes**

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

# **privateDirecaoTransportesPost**
> ModelDirecaoTransportes privateDirecaoTransportesPost(payload)


### Example

```typescript
import {
    DirecaoTransportesApi,
    Configuration,
    DirecaoTransportesCreateDirecaoTransportesRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DirecaoTransportesApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: DirecaoTransportesCreateDirecaoTransportesRequest; //Payload

const { status, data } = await apiInstance.privateDirecaoTransportesPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **DirecaoTransportesCreateDirecaoTransportesRequest**| Payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelDirecaoTransportes**

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

