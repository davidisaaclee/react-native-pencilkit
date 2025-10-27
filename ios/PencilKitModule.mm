#import "PencilKitModule.h"

@interface PencilKitModule()
@end

@implementation PencilKitModule
RCT_EXPORT_MODULE()

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativePencilKitModuleSpecJSI>(params);
}

- (void)addTwo:(double)n resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  resolve(@(n + 2));
}


@end
