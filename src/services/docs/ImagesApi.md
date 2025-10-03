# ImagesApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**publicImagesIdCheckGet**](#publicimagesidcheckget) | **GET** /public/images/{id}/check | Check Image|
|[**publicImagesIdGet**](#publicimagesidget) | **GET** /public/images/{id} | View Image|

# **publicImagesIdCheckGet**
> InoutOkResponse publicImagesIdCheckGet()

Checks if an image exists by filename

### Example

```typescript
import {
    ImagesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ImagesApi(configuration);

let id: string; //Image filename (default to undefined)

const { status, data } = await apiInstance.publicImagesIdCheckGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Image filename | defaults to undefined|


### Return type

**InoutOkResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **publicImagesIdGet**
> File publicImagesIdGet()

Returns the stored image by filename

### Example

```typescript
import {
    ImagesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new ImagesApi(configuration);

let id: string; //Image filename (default to undefined)

const { status, data } = await apiInstance.publicImagesIdGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | Image filename | defaults to undefined|


### Return type

**File**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/octet-stream


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Image bytes |  -  |
|**404** | Not Found |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

