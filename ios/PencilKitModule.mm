#import <PencilKit/PencilKit.h>
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

- (NSDictionary *)renderDrawingData:(NSString *)base64DrawingData
                               rect:(JS::NativePencilKitModule::SpecRenderDrawingDataRect &)rect
                              scale:(NSNumber *)scale
                        outFilePath:(NSString *)outFilePath
{
  NSData *drawingData = [[NSData alloc] initWithBase64EncodedString:base64DrawingData options:0];
  NSError *loadError;
  PKDrawing *drawing = [[PKDrawing alloc] initWithData:drawingData error:&loadError];
  if (loadError) {
    throw loadError;
  }
  // `rect` will be a null pointer when passing undefined from JS
  CGRect imageRect = (&rect == nullptr) ? drawing.bounds : [self rectFrom:rect];
  UIImage *img = [drawing imageFromRect:imageRect scale:scale ? [scale doubleValue] : 1.0];
  NSData *data = UIImagePNGRepresentation(img);
  
  NSString *outpath = outFilePath ?: [[self createUniqueTmpFileURL] path];
  BOOL success = [[NSFileManager defaultManager] createFileAtPath:outpath contents:data attributes:0];
  if (!success) {
    throw @"Failed to create file";
  }
  return @{
    @"imagePath": outpath,
    @"width": @(img.size.width),
    @"height": @(img.size.height),
  };
}

- (CGRect)rectFrom:(JS::NativePencilKitModule::SpecRenderDrawingDataRect &)rect
{
  return CGRectMake(rect.x(), rect.y(), rect.width(), rect.height());
}

- (NSURL *)createUniqueTmpFileURL
{
  NSURL *tmp = [[NSFileManager defaultManager] temporaryDirectory];
  return [tmp URLByAppendingPathComponent:[[NSUUID UUID] UUIDString]];
}

@end
