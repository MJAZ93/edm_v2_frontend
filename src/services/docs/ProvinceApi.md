# ProvinceApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**privateProvincesGet**](#privateprovincesget) | **GET** /private/provinces | List Provinces|
|[**privateProvincesIdDelete**](#privateprovincesiddelete) | **DELETE** /private/provinces/{id} | Delete Province|
|[**privateProvincesIdGet**](#privateprovincesidget) | **GET** /private/provinces/{id} | Get Province|
|[**privateProvincesIdPut**](#privateprovincesidput) | **PUT** /private/provinces/{id} | Update Province|
|[**privateProvincesPost**](#privateprovincespost) | **POST** /private/provinces | Create Province|

# **privateProvincesGet**
> ProvinceProvinceListResponse privateProvincesGet()

Paginated list of provinces

### Example

```typescript
import {
    ProvinceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProvinceApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let page: number; //Page number (-1 returns all) (optional) (default to undefined)
let pageSize: number; //Page size (optional) (default to undefined)
let orderBy: string; //Order by (optional) (default to 'id')
let orderDirection: string; //asc|desc (optional) (default to 'asc')
let name: string; //Filter by name (optional) (default to undefined)

const { status, data } = await apiInstance.privateProvincesGet(
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

**ProvinceProvinceListResponse**

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

# **privateProvincesIdDelete**
> privateProvincesIdDelete()


### Example

```typescript
import {
    ProvinceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProvinceApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateProvincesIdDelete(
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

# **privateProvincesIdGet**
> ModelProvince privateProvincesIdGet()


### Example

```typescript
import {
    ProvinceApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ProvinceApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)

const { status, data } = await apiInstance.privateProvincesIdGet(
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

**ModelProvince**

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

# **privateProvincesIdPut**
> ModelProvince privateProvincesIdPut(payload)


### Example

```typescript
import {
    ProvinceApi,
    Configuration,
    ProvinceUpdateProvinceRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ProvinceApi(configuration);

let id: string; //ID (default to undefined)
let authorization: string; //Bearer token (default to undefined)
let payload: ProvinceUpdateProvinceRequest; //Payload

const { status, data } = await apiInstance.privateProvincesIdPut(
    id,
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **ProvinceUpdateProvinceRequest**| Payload | |
| **id** | [**string**] | ID | defaults to undefined|
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelProvince**

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

# **privateProvincesPost**
> ModelProvince privateProvincesPost(payload)


### Example

```typescript
import {
    ProvinceApi,
    Configuration,
    ProvinceCreateProvinceRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new ProvinceApi(configuration);

let authorization: string; //Bearer token (default to undefined)
let payload: ProvinceCreateProvinceRequest; //Payload

const { status, data } = await apiInstance.privateProvincesPost(
    authorization,
    payload
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **payload** | **ProvinceCreateProvinceRequest**| Payload | |
| **authorization** | [**string**] | Bearer token | defaults to undefined|


### Return type

**ModelProvince**

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

