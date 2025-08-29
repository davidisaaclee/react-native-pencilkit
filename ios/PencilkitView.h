#import <React/RCTViewComponentView.h>
#import <UIKit/UIKit.h>
#import <PencilKit/PencilKit.h>

#ifndef PencilkitViewNativeComponent_h
#define PencilkitViewNativeComponent_h

NS_ASSUME_NONNULL_BEGIN

@interface PencilkitView : RCTViewComponentView
- (CGRect)drawingBounds;
- (NSDictionary *)requestDataUri;
- (NSString *)requestDrawingData;
@end

NS_ASSUME_NONNULL_END

#endif /* PencilkitViewNativeComponent_h */
