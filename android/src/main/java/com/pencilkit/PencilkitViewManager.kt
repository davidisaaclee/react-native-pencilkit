package com.pencilkit

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.PencilkitViewManagerInterface
import com.facebook.react.viewmanagers.PencilkitViewManagerDelegate

@ReactModule(name = PencilkitViewManager.NAME)
class PencilkitViewManager : SimpleViewManager<PencilkitView>(),
  PencilkitViewManagerInterface<PencilkitView> {
  private val mDelegate: ViewManagerDelegate<PencilkitView>

  init {
    mDelegate = PencilkitViewManagerDelegate(this)
  }

  override fun getDelegate(): ViewManagerDelegate<PencilkitView>? {
    return mDelegate
  }

  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): PencilkitView {
    return PencilkitView(context)
  }

  @ReactProp(name = "color")
  override fun setColor(view: PencilkitView?, color: String?) {
    view?.setBackgroundColor(Color.parseColor(color))
  }

  companion object {
    const val NAME = "PencilkitView"
  }
}
