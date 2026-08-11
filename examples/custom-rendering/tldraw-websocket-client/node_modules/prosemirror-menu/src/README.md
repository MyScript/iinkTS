# prosemirror-menu

[ [**WEBSITE**](https://prosemirror.net) | [**ISSUES**](https://github.com/prosemirror/prosemirror-menu/issues) | [**FORUM**](https://discuss.prosemirror.net) | [**GITTER**](https://gitter.im/ProseMirror/prosemirror) ]

This is a non-core example module for [ProseMirror](https://prosemirror.net).
ProseMirror is a well-behaved rich semantic content editor based on
contentEditable, with support for collaborative editing and custom
document schemas.

This module defines an abstraction for building a menu for the
ProseMirror editor, along with an implementation of a menubar.

**Note** that this module exists mostly as an example of how you
_might_ want to approach adding a menu to ProseMirror, but is not
maintained as actively as the core modules related to actual editing.
If you want to extend or improve it, the recommended way is to fork
it. If you are interested in maintaining a serious menu component for
ProseMirror, publish your fork, and if it works for me, I'll gladly
deprecate this in favor of your module.

This code is released under an
[MIT license](https://github.com/prosemirror/prosemirror/tree/master/LICENSE).
There's a [forum](http://discuss.prosemirror.net) for general
discussion and support requests, and the
[Github bug tracker](https://github.com/prosemirror/prosemirror-menu/issues)
is the place to report issues.

## Documentation

This module defines a number of building blocks for ProseMirror menus,
along with a [menu bar](#menu.menuBar) implementation.

When using this module, you should make sure its
[`style/menu.css`](https://github.com/ProseMirror/prosemirror-menu/blob/master/style/menu.css)
file is loaded into your page.

@MenuElement
@MenuItem
@MenuItemSpec
@IconSpec
@Dropdown
@DropdownSubmenu
@menuBar

This module exports the following pre-built items or item
constructors:

@joinUpItem
@liftItem
@selectParentNodeItem
@undoItem
@redoItem
@wrapItem
@blockTypeItem

To construct your own items, these icons may be useful:

@icons

@renderGrouped
