#import "PencilkitView.h"

#import <react/renderer/components/PencilkitViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/PencilkitViewSpec/EventEmitters.h>
#import <react/renderer/components/PencilkitViewSpec/Props.h>
#import <react/renderer/components/PencilkitViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface PencilkitView () <RCTPencilkitViewViewProtocol>

@end

@implementation PencilkitView {
  PKCanvasView* _Nonnull _view;
  PKTool* _tool;
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
    [_view setMaximumZoomScale:5];
    [_view setMinimumZoomScale:0.1];

    [_view setDrawingPolicy:PKCanvasViewDrawingPolicyAnyInput];
    _tool = [[PKInkingTool alloc] initWithInkType:PKInkTypePen color:[UIColor redColor] width:10.f];
    [_view setTool:_tool];
    [_view becomeFirstResponder];

    self.contentView = _view;
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<PencilkitViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<PencilkitViewProps const>(props);

    if (oldViewProps.color != newViewProps.color) {
        NSString * colorToConvert = [[NSString alloc] initWithUTF8String: newViewProps.color.c_str()];
        [_view setBackgroundColor:[self hexStringToColor:colorToConvert]];
    }

    [super updateProps:props oldProps:oldProps];
}

Class<RCTComponentViewProtocol> PencilkitViewCls(void)
{
    return PencilkitView.class;
}

- hexStringToColor:(NSString *)stringToConvert
{
    NSString *noHashString = [stringToConvert stringByReplacingOccurrencesOfString:@"#" withString:@""];
    NSScanner *stringScanner = [NSScanner scannerWithString:noHashString];

    unsigned hex;
    if (![stringScanner scanHexInt:&hex]) return nil;
    int r = (hex >> 16) & 0xFF;
    int g = (hex >> 8) & 0xFF;
    int b = (hex) & 0xFF;

    return [UIColor colorWithRed:r / 255.0f green:g / 255.0f blue:b / 255.0f alpha:1.0f];
}

@end
