#import "PencilkitView.h"

#import <react/renderer/components/PencilkitViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PencilkitViewSpec/EventEmitters.h>
#import <react/renderer/components/PencilkitViewSpec/Props.h>
#import <react/renderer/components/PencilkitViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface PencilkitView () <RCTPencilkitViewViewProtocol, PKCanvasViewDelegate>

@end

@implementation PencilkitView {
  PKCanvasView* _Nonnull _view;
  PKToolPicker* _Nullable _toolPicker;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<PencilkitViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const PencilkitViewProps>();
    _props = defaultProps;

    _view = [[PKCanvasView alloc] initWithFrame:frame];
    _view.opaque = NO;
    [_view setMaximumZoomScale:5];
    [_view setBouncesZoom:NO];
    /* [_view setMinimumZoomScale:0.1]; */
    /* [_view setDrawingPolicy:PKCanvasViewDrawingPolicyAnyInput]; */

    _toolPicker = [[PKToolPicker alloc] init];
    [_toolPicker addObserver:_view];
    [_toolPicker setVisible:YES forFirstResponder:_view];

    _view.delegate = self;

    self.contentView = _view;
  }

  return self;
}

- (void)dealloc {
  [_toolPicker removeObserver:_view];
}

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTPencilkitViewHandleCommand(self, commandName, args);
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldViewProps = *std::static_pointer_cast<PencilkitViewProps const>(_props);
  const auto &newViewProps = *std::static_pointer_cast<PencilkitViewProps const>(props);

  if (oldViewProps.drawingPolicy != newViewProps.drawingPolicy) {
    PKCanvasViewDrawingPolicy drawingPolicy = [self drawingPolicyFrom: newViewProps.drawingPolicy];
    [_view setDrawingPolicy:drawingPolicy];
  }
  if (oldViewProps.drawingEnabled != newViewProps.drawingEnabled) {
    if (@available(iOS 18.0, *)) {
      [_view setDrawingEnabled:newViewProps.drawingEnabled];
    } else {
      [_view setUserInteractionEnabled:newViewProps.drawingEnabled];
    }
  }
  if (!isnan(newViewProps.minimumZoomScale) && oldViewProps.minimumZoomScale != newViewProps.minimumZoomScale) {
    [_view setMinimumZoomScale:newViewProps.minimumZoomScale];
  }
  if (!isnan(newViewProps.maximumZoomScale) && oldViewProps.maximumZoomScale != newViewProps.maximumZoomScale) {
    [_view setMaximumZoomScale:newViewProps.maximumZoomScale];
  }
  
  CGSize newContentSize = _view.contentSize;
  if (!isnan(newViewProps.contentSizeWidth)) {
    newContentSize.width = newViewProps.contentSizeWidth;
  }
  if (!isnan(newViewProps.contentSizeHeight)) {
    newContentSize.height = newViewProps.contentSizeHeight;
  }
  if (oldViewProps.contentSizeWidth != newViewProps.contentSizeWidth || oldViewProps.contentSizeHeight != newViewProps.contentSizeHeight) {
    [_view setContentSize:newContentSize];
  }

  [super updateProps:props oldProps:oldProps];
}


- (PKCanvasViewDrawingPolicy)drawingPolicyFrom:(PencilkitViewDrawingPolicy)policy
{
  if (policy == facebook::react::PencilkitViewDrawingPolicy::AnyInput) {
    return PKCanvasViewDrawingPolicyAnyInput;
  } else if (policy == facebook::react::PencilkitViewDrawingPolicy::PencilOnly) {
    return PKCanvasViewDrawingPolicyPencilOnly;
  } else if (policy == facebook::react::PencilkitViewDrawingPolicy::Default) {
    return PKCanvasViewDrawingPolicyDefault;
  }
  return PKCanvasViewDrawingPolicyDefault;
}

Class<RCTComponentViewProtocol> PencilkitViewCls(void)
{
  return PencilkitView.class;
}

- (void)clear {
  [_view setDrawing:[[PKDrawing alloc] init]];
}

- (void)setToolPickerVisible:(BOOL)visible
{
  if (visible) {
    [_view becomeFirstResponder];
  } else {
    [_view resignFirstResponder];
  }
}

- (void)transformDrawing:(const NSArray *)transform
{
  CGAffineTransform affineTransform = CGAffineTransformMake(
    [transform[0] doubleValue],
    [transform[1] doubleValue],
    [transform[2] doubleValue],
    [transform[3] doubleValue],
    [transform[4] doubleValue],
    [transform[5] doubleValue]
  );

  PKDrawing *currentDrawing = [_view drawing];
  PKDrawing *transformedDrawing = [currentDrawing drawingByApplyingTransform:affineTransform];
  [_view setDrawing:transformedDrawing];
}

- (void)requestDataUri
{
  if (auto eventEmitter = std::static_pointer_cast<PencilkitViewEventEmitter const>(_eventEmitter)) {
    PKDrawing *currentDrawing = [_view drawing];
    UIImage *image = [currentDrawing imageFromRect:currentDrawing.bounds scale:1.0];

    if (image) {
      NSData *imageData = UIImagePNGRepresentation(image);
      if (imageData) {
        NSString *base64String = [imageData base64EncodedStringWithOptions:0];
        NSString *dataUri = [NSString stringWithFormat:@"data:image/png;base64,%@", base64String];

        PencilkitViewEventEmitter::OnDataUri event;
        event.success = true;
        event.uri = std::string([dataUri UTF8String]);
        event.frame = facebook::react::PencilkitViewEventEmitter::OnDataUriFrame{
          .x = currentDrawing.bounds.origin.x,
          .y = currentDrawing.bounds.origin.y,
          .width = currentDrawing.bounds.size.width,
          .height = currentDrawing.bounds.size.height
        };
        eventEmitter->onDataUri(event);
      } else {
        PencilkitViewEventEmitter::OnDataUri event;
        event.success = false;
        event.error = std::string("Failed to convert image to PNG data");
        eventEmitter->onDataUri(event);
      }
    } else {
      PencilkitViewEventEmitter::OnDataUri event;
      event.success = false;
      event.error = std::string("Failed to generate image from drawing");
      eventEmitter->onDataUri(event);
    }
  }
}

- (void)requestDrawingData
{
  if (auto eventEmitter = std::static_pointer_cast<PencilkitViewEventEmitter const>(_eventEmitter)) {
    PKDrawing *currentDrawing = [_view drawing];
    NSData *drawingData = [currentDrawing dataRepresentation];

    if (drawingData) {
      NSString *base64String = [drawingData base64EncodedStringWithOptions:0];

      PencilkitViewEventEmitter::OnDrawingData event;
      event.success = true;
      event.data = std::string([base64String UTF8String]);
      eventEmitter->onDrawingData(event);
    } else {
      PencilkitViewEventEmitter::OnDrawingData event;
      event.success = false;
      event.error = std::string("Failed to get drawing data representation");
      eventEmitter->onDrawingData(event);
    }
  }
}

- (void)loadDrawingData:(NSString *)base64String
{
  NSData *drawingData = [[NSData alloc] initWithBase64EncodedString:base64String options:0];

  if (drawingData) {
    NSError *error = nil;
    PKDrawing *drawing = [[PKDrawing alloc] initWithData:drawingData error:&error];
    if (drawing && !error) {
      [_view setDrawing:drawing];
    }
  }
}

- (void)setViewport:(double)contentOffsetX
        contentOffsetY:(double)contentOffsetY
             zoomScale:(double)zoomScale
{
  CGPoint currentContentOffset = _view.contentOffset;
  CGFloat currentZoomScale = _view.zoomScale;
  
  // Update content offset if provided (not NaN)
  CGPoint newContentOffset = currentContentOffset;
  if (!isnan(contentOffsetX)) {
    newContentOffset.x = contentOffsetX;
  }
  if (!isnan(contentOffsetY)) {
    newContentOffset.y = contentOffsetY;
  }
  
  // Update zoom scale if provided (not NaN)
  CGFloat newZoomScale = currentZoomScale;
  if (!isnan(zoomScale)) {
    newZoomScale = zoomScale;
  }
  
  // Apply the changes
  if (!isnan(zoomScale)) {
    [_view setZoomScale:newZoomScale animated:NO];
  }
  
  if (!isnan(contentOffsetX) || !isnan(contentOffsetY)) {
    [_view setContentOffset:newContentOffset animated:NO];
  }
}

- (void)zoomToRect:(double)originX
           originY:(double)originY
         sizeWidth:(double)sizeWidth
        sizeHeight:(double)sizeHeight
          animated:(BOOL)animated
{
  CGRect rect = CGRectMake(originX, originY, sizeWidth, sizeHeight);
  [_view zoomToRect:rect animated:animated];
}

#pragma mark - UIScrollViewDelegate

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  if (auto eventEmitter = std::static_pointer_cast<PencilkitViewEventEmitter const>(_eventEmitter)) {
    PencilkitViewEventEmitter::OnScroll event;
    event.contentOffset = {
      .x = scrollView.contentOffset.x,
      .y = scrollView.contentOffset.y
    };
    event.contentSize = {
      .width = scrollView.contentSize.width,
      .height = scrollView.contentSize.height
    };
    event.zoomScale = scrollView.zoomScale;
    eventEmitter->onScroll(event);
  }
}

- (void)scrollViewDidZoom:(UIScrollView *)scrollView
{
  if (auto eventEmitter = std::static_pointer_cast<PencilkitViewEventEmitter const>(_eventEmitter)) {
    PencilkitViewEventEmitter::OnZoom event;
    event.contentOffset = {
      .x = scrollView.contentOffset.x,
      .y = scrollView.contentOffset.y
    };
    event.contentSize = {
      .width = scrollView.contentSize.width,
      .height = scrollView.contentSize.height
    };
    event.zoomScale = scrollView.zoomScale;
    eventEmitter->onZoom(event);
  }
}

@end
