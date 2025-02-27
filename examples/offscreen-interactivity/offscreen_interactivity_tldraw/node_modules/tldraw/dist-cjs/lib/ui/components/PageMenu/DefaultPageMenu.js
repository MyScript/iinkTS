"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var DefaultPageMenu_exports = {};
__export(DefaultPageMenu_exports, {
  DefaultPageMenu: () => DefaultPageMenu
});
module.exports = __toCommonJS(DefaultPageMenu_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_constants = require("../../constants");
var import_breakpoints = require("../../context/breakpoints");
var import_events = require("../../context/events");
var import_useMenuIsOpen = require("../../hooks/useMenuIsOpen");
var import_useReadonly = require("../../hooks/useReadonly");
var import_useTranslation = require("../../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("../primitives/Button/TldrawUiButton");
var import_TldrawUiButtonCheck = require("../primitives/Button/TldrawUiButtonCheck");
var import_TldrawUiButtonIcon = require("../primitives/Button/TldrawUiButtonIcon");
var import_TldrawUiButtonLabel = require("../primitives/Button/TldrawUiButtonLabel");
var import_TldrawUiPopover = require("../primitives/TldrawUiPopover");
var import_PageItemInput = require("./PageItemInput");
var import_PageItemSubmenu = require("./PageItemSubmenu");
var import_edit_pages_shared = require("./edit-pages-shared");
const DefaultPageMenu = (0, import_react.memo)(function DefaultPageMenu2() {
  const editor = (0, import_editor.useEditor)();
  const trackEvent = (0, import_events.useUiEvents)();
  const msg = (0, import_useTranslation.useTranslation)();
  const breakpoint = (0, import_breakpoints.useBreakpoint)();
  const handleOpenChange = (0, import_react.useCallback)(() => setIsEditing(false), []);
  const [isOpen, onOpenChange] = (0, import_useMenuIsOpen.useMenuIsOpen)("page-menu", handleOpenChange);
  const ITEM_HEIGHT = 36;
  const rSortableContainer = (0, import_react.useRef)(null);
  const pages = (0, import_editor.useValue)("pages", () => editor.getPages(), [editor]);
  const currentPage = (0, import_editor.useValue)("currentPage", () => editor.getCurrentPage(), [editor]);
  const currentPageId = (0, import_editor.useValue)("currentPageId", () => editor.getCurrentPageId(), [editor]);
  const isReadonlyMode = (0, import_useReadonly.useReadonly)();
  const maxPageCountReached = (0, import_editor.useValue)(
    "maxPageCountReached",
    () => editor.getPages().length >= editor.options.maxPages,
    [editor]
  );
  const isCoarsePointer = (0, import_editor.useValue)(
    "isCoarsePointer",
    () => editor.getInstanceState().isCoarsePointer,
    [editor]
  );
  const [isEditing, setIsEditing] = (0, import_react.useState)(false);
  const toggleEditing = (0, import_react.useCallback)(() => {
    if (isReadonlyMode) return;
    setIsEditing((s) => !s);
  }, [isReadonlyMode]);
  const rMutables = (0, import_react.useRef)({
    isPointing: false,
    status: "idle",
    pointing: null,
    startY: 0,
    startIndex: 0,
    dragIndex: 0
  });
  const [sortablePositionItems, setSortablePositionItems] = (0, import_react.useState)(
    Object.fromEntries(
      pages.map((page, i) => [page.id, { y: i * ITEM_HEIGHT, offsetY: 0, isSelected: false }])
    )
  );
  (0, import_react.useLayoutEffect)(() => {
    setSortablePositionItems(
      Object.fromEntries(
        pages.map((page, i) => [page.id, { y: i * ITEM_HEIGHT, offsetY: 0, isSelected: false }])
      )
    );
  }, [ITEM_HEIGHT, pages]);
  (0, import_react.useEffect)(() => {
    if (!isOpen) return;
    editor.timers.requestAnimationFrame(() => {
      const elm = document.querySelector(
        `[data-testid="page-menu-item-${currentPageId}"]`
      );
      if (elm) {
        const container = rSortableContainer.current;
        if (!container) return;
        const elmTopPosition = elm.offsetTop;
        const containerScrollTopPosition = container.scrollTop;
        if (elmTopPosition < containerScrollTopPosition) {
          container.scrollTo({ top: elmTopPosition });
        }
        const elmBottomPosition = elmTopPosition + ITEM_HEIGHT;
        const containerScrollBottomPosition = container.scrollTop + container.offsetHeight;
        if (elmBottomPosition > containerScrollBottomPosition) {
          container.scrollTo({ top: elmBottomPosition - container.offsetHeight });
        }
      }
    });
  }, [ITEM_HEIGHT, currentPageId, isOpen, editor]);
  const handlePointerDown = (0, import_react.useCallback)(
    (e) => {
      const { clientY, currentTarget } = e;
      const {
        dataset: { id, index }
      } = currentTarget;
      if (!id || !index) return;
      const mut = rMutables.current;
      (0, import_editor.setPointerCapture)(e.currentTarget, e);
      mut.status = "pointing";
      mut.pointing = { id, index: +index };
      const current = sortablePositionItems[id];
      const dragY = current.y;
      mut.startY = clientY;
      mut.startIndex = Math.max(0, Math.min(Math.round(dragY / ITEM_HEIGHT), pages.length - 1));
    },
    [ITEM_HEIGHT, pages.length, sortablePositionItems]
  );
  const handlePointerMove = (0, import_react.useCallback)(
    (e) => {
      const mut = rMutables.current;
      if (mut.status === "pointing") {
        const { clientY } = e;
        const offset = clientY - mut.startY;
        if (Math.abs(offset) > 5) {
          mut.status = "dragging";
        }
      }
      if (mut.status === "dragging") {
        const { clientY } = e;
        const offsetY = clientY - mut.startY;
        const current = sortablePositionItems[mut.pointing.id];
        const { startIndex, pointing } = mut;
        const dragY = current.y + offsetY;
        const dragIndex = Math.max(0, Math.min(Math.round(dragY / ITEM_HEIGHT), pages.length - 1));
        const next = { ...sortablePositionItems };
        next[pointing.id] = {
          y: current.y,
          offsetY,
          isSelected: true
        };
        if (dragIndex !== mut.dragIndex) {
          mut.dragIndex = dragIndex;
          for (let i = 0; i < pages.length; i++) {
            const item = pages[i];
            if (item.id === mut.pointing.id) {
              continue;
            }
            let { y } = next[item.id];
            if (dragIndex === startIndex) {
              y = i * ITEM_HEIGHT;
            } else if (dragIndex < startIndex) {
              if (dragIndex <= i && i < startIndex) {
                y = (i + 1) * ITEM_HEIGHT;
              } else {
                y = i * ITEM_HEIGHT;
              }
            } else if (dragIndex > startIndex) {
              if (dragIndex >= i && i > startIndex) {
                y = (i - 1) * ITEM_HEIGHT;
              } else {
                y = i * ITEM_HEIGHT;
              }
            }
            if (y !== next[item.id].y) {
              next[item.id] = { y, offsetY: 0, isSelected: true };
            }
          }
        }
        setSortablePositionItems(next);
      }
    },
    [ITEM_HEIGHT, pages, sortablePositionItems]
  );
  const handlePointerUp = (0, import_react.useCallback)(
    (e) => {
      const mut = rMutables.current;
      if (mut.status === "dragging") {
        const { id, index } = mut.pointing;
        (0, import_edit_pages_shared.onMovePage)(editor, id, index, mut.dragIndex, trackEvent);
      }
      (0, import_editor.releasePointerCapture)(e.currentTarget, e);
      mut.status = "idle";
    },
    [editor, trackEvent]
  );
  const handleKeyDown = (0, import_react.useCallback)(
    (e) => {
      const mut = rMutables.current;
      if (e.key === "Escape") {
        if (mut.status === "dragging") {
          setSortablePositionItems(
            Object.fromEntries(
              pages.map((page, i) => [
                page.id,
                { y: i * ITEM_HEIGHT, offsetY: 0, isSelected: false }
              ])
            )
          );
        }
        mut.status = "idle";
      }
    },
    [ITEM_HEIGHT, pages]
  );
  const handleCreatePageClick = (0, import_react.useCallback)(() => {
    if (isReadonlyMode) return;
    editor.run(() => {
      editor.markHistoryStoppingPoint("creating page");
      const newPageId = import_editor.PageRecordType.createId();
      editor.createPage({ name: msg("page-menu.new-page-initial-name"), id: newPageId });
      editor.setCurrentPage(newPageId);
      setIsEditing(true);
    });
    trackEvent("new-page", { source: "page-menu" });
  }, [editor, msg, isReadonlyMode, trackEvent]);
  const changePage = (0, import_react.useCallback)(
    (id) => {
      editor.setCurrentPage(id);
      trackEvent("change-page", { source: "page-menu" });
    },
    [editor, trackEvent]
  );
  const renamePage = (0, import_react.useCallback)(
    (id, name) => {
      editor.renamePage(id, name);
      trackEvent("rename-page", { source: "page-menu" });
    },
    [editor, trackEvent]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiPopover.TldrawUiPopover, { id: "pages", onOpenChange, open: isOpen, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiPopover.TldrawUiPopoverTrigger, { "data-testid": "main.page-menu", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      import_TldrawUiButton.TldrawUiButton,
      {
        type: "menu",
        title: currentPage.name,
        "data-testid": "page-menu.button",
        className: "tlui-page-menu__trigger",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-page-menu__name", children: currentPage.name }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "chevron-down", small: true })
        ]
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_TldrawUiPopover.TldrawUiPopoverContent,
      {
        side: "bottom",
        align: "start",
        sideOffset: 6,
        disableEscapeKeyDown: isEditing,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-page-menu__wrapper", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-page-menu__header", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-page-menu__header__title", children: msg("page-menu.title") }),
            !isReadonlyMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-buttons__horizontal", children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_TldrawUiButton.TldrawUiButton,
                {
                  type: "icon",
                  "data-testid": "page-menu.edit",
                  title: msg(isEditing ? "page-menu.edit-done" : "page-menu.edit-start"),
                  onClick: toggleEditing,
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: isEditing ? "check" : "edit" })
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                import_TldrawUiButton.TldrawUiButton,
                {
                  type: "icon",
                  "data-testid": "page-menu.create",
                  title: msg(
                    maxPageCountReached ? "page-menu.max-page-count-reached" : "page-menu.create-new-page"
                  ),
                  disabled: maxPageCountReached,
                  onClick: handleCreatePageClick,
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "plus" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              "data-testid": "page-menu.list",
              className: "tlui-page-menu__list tlui-menu__group",
              style: { height: ITEM_HEIGHT * pages.length + 4 },
              ref: rSortableContainer,
              children: pages.map((page, index) => {
                const position = sortablePositionItems[page.id] ?? {
                  position: index * 40,
                  offsetY: 0
                };
                return isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                  "div",
                  {
                    "data-testid": "page-menu.item",
                    className: "tlui-page_menu__item__sortable",
                    style: {
                      zIndex: page.id === currentPage.id ? 888 : index,
                      transform: `translate(0px, ${position.y + position.offsetY}px)`
                    },
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        import_TldrawUiButton.TldrawUiButton,
                        {
                          type: "icon",
                          tabIndex: -1,
                          className: "tlui-page_menu__item__sortable__handle",
                          onPointerDown: handlePointerDown,
                          onPointerUp: handlePointerUp,
                          onPointerMove: handlePointerMove,
                          onKeyDown: handleKeyDown,
                          "data-id": page.id,
                          "data-index": index,
                          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonIcon.TldrawUiButtonIcon, { icon: "drag-handle-dots" })
                        }
                      ),
                      breakpoint < import_constants.PORTRAIT_BREAKPOINT.TABLET_SM && isCoarsePointer ? (
                        // sigh, this is a workaround for iOS Safari
                        // because the device and the radix popover seem
                        // to be fighting over scroll position. Nothing
                        // else seems to work!
                        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                          import_TldrawUiButton.TldrawUiButton,
                          {
                            type: "normal",
                            className: "tlui-page-menu__item__button",
                            onClick: () => {
                              const name = window.prompt("Rename page", page.name);
                              if (name && name !== page.name) {
                                renamePage(page.id, name);
                              }
                            },
                            onDoubleClick: toggleEditing,
                            children: [
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonCheck.TldrawUiButtonCheck, { checked: page.id === currentPage.id }),
                              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: page.name })
                            ]
                          }
                        )
                      ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                        "div",
                        {
                          className: "tlui-page_menu__item__sortable__title",
                          style: { height: ITEM_HEIGHT },
                          children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                            import_PageItemInput.PageItemInput,
                            {
                              id: page.id,
                              name: page.name,
                              isCurrentPage: page.id === currentPage.id,
                              onCancel: () => {
                                setIsEditing(false);
                                editor.menus.clearOpenMenus();
                              }
                            }
                          )
                        }
                      ),
                      !isReadonlyMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-page_menu__item__submenu", "data-isediting": isEditing, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_PageItemSubmenu.PageItemSubmenu, { index, item: page, listSize: pages.length }) })
                    ]
                  },
                  page.id + "_editing"
                ) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { "data-testid": "page-menu.item", className: "tlui-page-menu__item", children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                    import_TldrawUiButton.TldrawUiButton,
                    {
                      type: "normal",
                      className: "tlui-page-menu__item__button",
                      onClick: () => changePage(page.id),
                      onDoubleClick: toggleEditing,
                      title: msg("page-menu.go-to-page"),
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonCheck.TldrawUiButtonCheck, { checked: page.id === currentPage.id }),
                        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: page.name })
                      ]
                    }
                  ),
                  !isReadonlyMode && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-page_menu__item__submenu", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    import_PageItemSubmenu.PageItemSubmenu,
                    {
                      index,
                      item: page,
                      listSize: pages.length,
                      onRename: () => {
                        if (import_editor.tlenv.isIos) {
                          const name = window.prompt("Rename page", page.name);
                          if (name && name !== page.name) {
                            renamePage(page.id, name);
                          }
                        } else {
                          setIsEditing(true);
                          if (currentPageId !== page.id) {
                            changePage(page.id);
                          }
                        }
                      }
                    }
                  ) })
                ] }, page.id);
              })
            }
          )
        ] })
      }
    )
  ] });
});
//# sourceMappingURL=DefaultPageMenu.js.map
