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
