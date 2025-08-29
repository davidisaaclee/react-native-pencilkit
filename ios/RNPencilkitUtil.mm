#import "RNPencilkitUtil.h"
#import "PencilkitView.h"
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>

@implementation RNPencilKitUtil

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (PencilkitView *)getView:(double)viewId {
  return static_cast<PencilkitView*>(
      [self.bridge.uiManager viewForReactTag:[NSNumber numberWithDouble:viewId]]);
  ;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams&)params {
  return std::make_shared<facebook::react::NativePencilkitUtilSpecJSI>(params);
}

- (void)getDrawingBounds:(double)viewId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  RCTExecuteOnMainQueue(^{
    PencilkitView *view = [self getView:viewId];
    CGRect bounds = [view drawingBounds];
    resolve(@{
      @"x": @(bounds.origin.x),
      @"y": @(bounds.origin.y),
      @"width": @(bounds.size.width),
      @"height": @(bounds.size.height),
    });
  });
}

- (void)requestDataUri:(double)viewId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  RCTExecuteOnMainQueue(^{
    @try {
      PencilkitView *view = [self getView:viewId];
      NSDictionary *result = [view requestDataUri];
      resolve(@{
        @"success": @YES,
        @"uri": result[@"uri"],
        @"frame": result[@"frame"]
      });
    } @catch (NSException *exception) {
      reject(@"PencilkitError", exception.reason, nil);
    }
  });
}

- (void)requestDrawingData:(double)viewId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  RCTExecuteOnMainQueue(^{
    @try {
      PencilkitView *view = [self getView:viewId];
      NSString *result = [view requestDrawingData];
      resolve(@{
        @"success": @YES,
        @"data": result
      });
    } @catch (NSException *exception) {
      reject(@"PencilkitError", exception.reason, nil);
    }
  });
}

@end

