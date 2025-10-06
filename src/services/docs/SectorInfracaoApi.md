# SectorInfracaoApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateSectorInfracaoGet**](#privatesectorinfracaoget) | **GET** /private/sector_infracao | List Sectors|
|[**privateSectorInfracaoIdDelete**](#privatesectorinfracaoiddelete) | **DELETE** /private/sector_infracao/{id} | Delete Sector|
|[**privateSectorInfracaoIdGet**](#privatesectorinfracaoidget) | **GET** /private/sector_infracao/{id} | Get Sector|
|[**privateSectorInfracaoIdPut**](#privatesectorinfracaoidput) | **PUT** /private/sector_infracao/{id} | Update Sector|
|[**privateSectorInfracaoPost**](#privatesectorinfracaopost) | **POST** /private/sector_infracao | Create Sector|

# **privateSectorInfracaoGet**
> SectorInfracaoSectorInfracaoListResponse privateSectorInfracaoGet()

Paginated list of SectorInfracao

### Example

```typescript
import {
    SectorInfracaoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SectorInfracaoApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (-1 returns all) (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'id')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let name: string; //Filter by name (optional) (default to undefined)

const { status, data } = await apiInstance.privateSectorInfracaoGet(
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

**SectorInfracaoSectorInfracaoListResponse**

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

# **privateSectorInfracaoIdDelete**
> privateSectorInfracaoIdDelete()


### Example

```typescript
import {
    SectorInfracaoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SectorInfracaoApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateSectorInfracaoIdDelete(
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

# **privateSectorInfracaoIdGet**
> ModelSectorInfracao privateSectorInfracaoIdGet()


### Example

```typescript
import {
    SectorInfracaoApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new SectorInfracaoApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateSectorInfracaoIdGet(
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

**ModelSectorInfracao**

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

# **privateSectorInfracaoIdPut**
> ModelSectorInfracao privateSectorInfracaoIdPut(payload)


### Example

```typescript
import {
    SectorInfracaoApi,
    Configuration,
    SectorInfracaoUpdateSectorInfracaoRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new SectorInfracaoApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: SectorInfracaoUpdateSectorInfracaoRequest; //Payload

const { status, data } = await apiInstance.privateSectorInfracaoIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **SectorInfracaoUpdateSectorInfracaoRequest**| Payload | |
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelSectorInfracao**

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

# **privateSectorInfracaoPost**
> ModelSectorInfracao privateSectorInfracaoPost(payload)


### Example

```typescript
import {
    SectorInfracaoApi,
    Configuration,
    SectorInfracaoCreateSectorInfracaoRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new SectorInfracaoApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: SectorInfracaoCreateSectorInfracaoRequest; //Payload

const { status, data } = await apiInstance.privateSectorInfracaoPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **SectorInfracaoCreateSectorInfracaoRequest**| Payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelSectorInfracao**

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

