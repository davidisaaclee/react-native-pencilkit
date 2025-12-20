#import <PencilKit/PencilKit.h>
#import "PencilKitModule.h"

@interface PencilKitModule()
@property NSMutableDictionary *drawings;
@property int nextDrawingId;
@end

@implementation PencilKitModule
RCT_EXPORT_MODULE()

- (instancetype)init
{
  self = [super init];
  if (self) {
    self.drawings = [[NSMutableDictionary alloc] init];
    self.nextDrawingId = 1;
  }
  return self;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativePencilKitModuleSpecJSI>(params);
}

- (NSDictionary *)renderDrawingData:(NSString *)base64DrawingData
                               rect:(JS::NativePencilKitModule::Rect &)rect
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
  CGRect imageRect = (&rect == nullptr) ? drawing.bounds : [self cgRectFrom:rect];
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

- (NSNumber *)pkDrawingFromData:(NSString *)base64DrawingData
{
  NSData *drawingData = [[NSData alloc] initWithBase64EncodedString:base64DrawingData options:0];
  NSError *loadError;
  PKDrawing *drawing = [[PKDrawing alloc] initWithData:drawingData error:&loadError];
  if (loadError) {
    throw loadError;
  }
  NSNumber *key = @(self.nextDrawingId);
  self.drawings[key] = drawing;
  self.nextDrawingId++;
  return key;
}

- (NSDictionary *)pkDrawingBounds:(double)handle
{
  NSNumber *key = [NSNumber numberWithInt:(int)handle];
  PKDrawing *drawing = self.drawings[key];
  if (!drawing) {
    throw @"No such PKDrawing";
  }
  return [self jsRectDictFrom:[drawing bounds]];
}

- (void)pkDrawingRelease:(double)handle
{
  NSNumber *key = [NSNumber numberWithInt:(int)handle];
  [self.drawings removeObjectForKey:key];
}

- (CGRect)cgRectFrom:(JS::NativePencilKitModule::Rect &)rect
{
  return CGRectMake(rect.x(), rect.y(), rect.width(), rect.height());
}

- (NSDictionary *)jsRectDictFrom:(CGRect)rect
{
  return @{
    @"x": @(rect.origin.x),
    @"y": @(rect.origin.y),
    @"width": @(rect.size.width),
    @"height": @(rect.size.height),
  };
}


- (NSURL *)createUniqueTmpFileURL
{
  NSURL *tmp = [[NSFileManager defaultManager] temporaryDirectory];
  return [tmp URLByAppendingPathComponent:[[NSUUID UUID] UUIDString]];
}

@end
