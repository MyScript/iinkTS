import crel from 'crelt';
import { joinUp, lift, selectParentNode, setBlockType, wrapIn } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { Plugin } from 'prosemirror-state';

const SVG = "http://www.w3.org/2000/svg";
const XLINK = "http://www.w3.org/1999/xlink";
const prefix$2 = "ProseMirror-icon";
function hashPath(path) {
    let hash = 0;
    for (let i = 0; i < path.length; i++)
        hash = (((hash << 5) - hash) + path.charCodeAt(i)) | 0;
    return hash;
}
function getIcon(root, icon) {
    let doc = (root.nodeType == 9 ? root : root.ownerDocument) || document;
    let node = doc.createElement("button");
    node.className = prefix$2;
    if (icon.path) {
        let { path, width, height } = icon;
        let name = "pm-icon-" + hashPath(path).toString(16);
        if (!doc.getElementById(name))
            buildSVG(root, name, icon);
        let svg = node.appendChild(doc.createElementNS(SVG, "svg"));
        svg.style.width = (width / height) + "em";
        let use = svg.appendChild(doc.createElementNS(SVG, "use"));
        use.setAttributeNS(XLINK, "href", /([^#]*)/.exec(doc.location.toString())[1] + "#" + name);
    }
    else if (icon.dom) {
        node.appendChild(icon.dom.cloneNode(true));
    }
    else {
        let { text, css } = icon;
        node.appendChild(doc.createElement("span")).textContent = text || '';
        if (css)
            node.firstChild.style.cssText = css;
    }
    return node;
}
function buildSVG(root, name, data) {
    let [doc, top] = root.nodeType == 9 ? [root, root.body] : [root.ownerDocument || document, root];
    let collection = doc.getElementById(prefix$2 + "-collection");
    if (!collection) {
        collection = doc.createElementNS(SVG, "svg");
        collection.id = prefix$2 + "-collection";
        collection.style.display = "none";
        top.insertBefore(collection, top.firstChild);
    }
    let sym = doc.createElementNS(SVG, "symbol");
    sym.id = name;
    sym.setAttribute("viewBox", "0 0 " + data.width + " " + data.height);
    let path = sym.appendChild(doc.createElementNS(SVG, "path"));
    path.setAttribute("d", data.path);
    collection.appendChild(sym);
}

const prefix$1 = "ProseMirror-menu";
/**
An icon or label that, when clicked, executes a command.
*/
class MenuItem {
    /**
    Create a menu item.
    */
    constructor(
    /**
    The spec used to create this item.
    */
    spec) {
        this.spec = spec;
    }
    /**
    Renders the icon according to its [display
    spec](https://prosemirror.net/docs/ref/#menu.MenuItemSpec.display), and adds an event handler which
    executes the command when the representation is clicked.
    */
    render(view) {
        let spec = this.spec;
        let dom = spec.render ? spec.render(view)
            : spec.icon ? getIcon(view.root, spec.icon)
                : spec.label ? crel("button", null, translate(view, spec.label))
                    : null;
        if (!dom)
            throw new RangeError("MenuItem without icon or label property");
        if (spec.title) {
            let title = (typeof spec.title === "function" ? spec.title(view.state) : spec.title);
            dom.setAttribute("title", translate(view, title));
        }
        if (spec.class)
            dom.classList.add(spec.class);
        if (spec.css)
            dom.style.cssText += spec.css;
        dom.addEventListener("click", e => {
            if (!dom.classList.contains(prefix$1 + "-disabled")) {
                let setFocus = document.activeElement == dom || document.activeElement == view.dom;
                spec.run(view.state, view.dispatch, view, e);
                if (setFocus && document.activeElement == dom)
                    view.focus();
            }
        });
        // Clicking on a menu item should not remove focus from the editor
        dom.addEventListener("mousedown", e => e.preventDefault());
        function update(state) {
            if (spec.select) {
                let selected = spec.select(state);
                dom.style.display = selected ? "" : "none";
                if (!selected)
                    return false;
            }
            let enabled = true;
            if (spec.enable) {
                enabled = spec.enable(state) || false;
                setClass(dom, prefix$1 + "-disabled", !enabled);
                dom.setAttribute("aria-disabled", (!enabled).toString());
            }
            if (spec.active) {
                let active = enabled && spec.active(state) || false;
                setClass(dom, prefix$1 + "-active", active);
                dom.setAttribute("aria-pressed", active.toString());
            }
            return true;
        }
        return { dom, update };
    }
}
function translate(view, text) {
    return view._props.translate ? view._props.translate(text) : text;
}
let lastMenuEvent = { time: 0, node: null };
function markMenuEvent(e) {
    lastMenuEvent.time = Date.now();
    lastMenuEvent.node = e.target;
}
function isMenuEvent(wrapper) {
    return Date.now() - 100 < lastMenuEvent.time &&
        lastMenuEvent.node && wrapper.contains(lastMenuEvent.node);
}
/**
A drop-down menu, displayed as a label with a downwards-pointing
triangle to the right of it.
*/
class Dropdown {
    /**
    Create a dropdown wrapping the elements.
    */
    constructor(content, 
    /**
    @internal
    */
    options = {}) {
        this.options = options;
        /**
        @internal
        */
        this.focusables = [];
        /**
        @internal
        */
        this.focusIndex = 0;
        this.focusTimeout = -1;
        this.options = options || {};
        this.content = Array.isArray(content) ? content : [content];
    }
    /**
    Render the dropdown menu and sub-items.
    */
    render(view) {
        let content = renderDropdownItems(this.content, view);
        this.focusables = content.focusables;
        let win = view.dom.ownerDocument.defaultView || window;
        let btn = crel("button", {
            class: prefix$1 + "-dropdown " + (this.options.class || ""),
            style: this.options.css,
            "aria-haspopup": "menu",
            "aria-expanded": "false"
        }, translate(view, this.options.label || ""));
        if (this.options.title)
            btn.setAttribute("title", translate(view, this.options.title));
        let wrap = crel("div", { class: prefix$1 + "-dropdown-wrap" }, btn);
        let open = null;
        let listeningOnClose = null;
        let close = () => {
            if (open && open.close()) {
                open = null;
                win.removeEventListener("click", listeningOnClose);
            }
        };
        btn.addEventListener("click", e => {
            markMenuEvent(e);
            if (open) {
                close();
            }
            else {
                open = this.expand(wrap, content.dom, btn);
                win.addEventListener("click", listeningOnClose = () => {
                    if (!isMenuEvent(wrap))
                        close();
                });
                // If triggered using the keyboard, move focus to first item
                if (e.detail === 0) {
                    let focusIndex = findFocusableIndex(this.focusables, -1, 1);
                    if (focusIndex != null)
                        this.setFocusIndex(focusIndex);
                }
                open.node.addEventListener("keydown", (event) => {
                    markMenuEvent(event);
                    if (keyboardMoveFocus(this, event, "vertical")) ;
                    else if (event.key === "Escape") {
                        event.preventDefault();
                        event.stopPropagation();
                        close();
                        btn.focus();
                    }
                });
                open.node.addEventListener("focusout", () => {
                    clearTimeout(this.focusTimeout);
                    this.focusTimeout = setTimeout(() => {
                        let active = win.document.activeElement;
                        if (active && open && !open.node.contains(active))
                            close();
                    }, 20);
                });
            }
        });
        // Clicking on a dropdown should not remove focus from the editor
        btn.addEventListener("mousedown", e => e.preventDefault());
        function update(state) {
            let inner = content.update(state);
            wrap.style.display = inner ? "" : "none";
            return inner;
        }
        return { dom: wrap, update, focusable: btn };
    }
    /**
    @internal
    */
    expand(dom, items, trigger) {
        let menuDOM = crel("div", { class: prefix$1 + "-dropdown-menu " + (this.options.class || "") }, items);
        let done = false;
        function close() {
            if (done)
                return false;
            done = true;
            dom.removeChild(menuDOM);
            trigger.ariaControlsElements = [];
            trigger.setAttribute("aria-expanded", "false");
            return true;
        }
        dom.appendChild(menuDOM);
        trigger.ariaControlsElements = [items];
        trigger.setAttribute("aria-expanded", "true");
        return { close, node: menuDOM };
    }
    setFocusIndex(index) {
        if (this.focusables.length <= 1)
            return;
        this.focusables[this.focusIndex].setAttribute("tabindex", "-1");
        this.focusIndex = index;
        let nextFocusItem = this.focusables[index];
        nextFocusItem.setAttribute("tabindex", "0");
        nextFocusItem.focus();
    }
}
function findFocusableIndex(focusables, startIndex, delta) {
    let length = focusables.length;
    for (let i = 0, index = startIndex + delta;; index += delta, i++) {
        let normIndex = (index + length) % length;
        if (focusables[normIndex].style.display != "none")
            return normIndex;
        if (i == length)
            return null;
    }
}
function keyboardMoveFocus(control, event, orientation) {
    let { focusables, focusIndex } = control;
    let move = event.key == (orientation == "vertical" ? "ArrowDown" : "ArrowRight") ? findFocusableIndex(focusables, focusIndex, 1) :
        event.key == (orientation == "vertical" ? "ArrowUp" : "ArrowLeft") ? findFocusableIndex(focusables, focusIndex, -1) :
            event.key == "Home" ? findFocusableIndex(focusables, -1, 1) :
                event.key == "End" ? findFocusableIndex(focusables, focusables.length, -1) : null;
    if (move == null)
        return false;
    event.preventDefault();
    event.stopPropagation();
    control.setFocusIndex(move);
    return true;
}
function renderDropdownItems(items, view) {
    let elts = [], focusables = [], updates = [];
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        let { dom, update, focusable } = item.render(view);
        elts.push(crel("li", {
            class: `${prefix$1}-dropdown-item`,
            role: "menuitem",
            "tabindex": "-1"
        }, dom));
        focusables.push(focusable || dom);
        updates.push(update);
    }
    function update(state) {
        let something = false;
        for (let i = 0; i < elts.length; i++) {
            let dom = elts[i], up = updates[i](state);
            if (up)
                something = true;
            dom.style.display = up ? "" : "none";
        }
        return something;
    }
    return { dom: crel("ul", { role: "menu" }, elts), update, focusables };
}
function combineUpdates(updates, nodes) {
    return (state) => {
        let something = false;
        for (let i = 0; i < updates.length; i++) {
            let up = updates[i](state);
            nodes[i].style.display = up ? "" : "none";
            if (up)
                something = true;
        }
        return something;
    };
}
/**
Represents a submenu wrapping a group of elements that start
hidden and expand to the right when hovered over or tapped.
*/
class DropdownSubmenu {
    /**
    Creates a submenu for the given group of menu elements. The
    following options are recognized:
    */
    constructor(content, 
    /**
    @internal
    */
    options = {}) {
        this.options = options;
        /**
        @internal
        */
        this.focusables = [];
        /**
        @internal
        */
        this.focusIndex = 0;
        this.focusTimeout = -1;
        this.content = Array.isArray(content) ? content : [content];
    }
    /**
    Renders the submenu.
    */
    render(view) {
        let items = renderDropdownItems(this.content, view);
        this.focusables = items.focusables;
        let win = view.dom.ownerDocument.defaultView || window;
        let btn = crel("button", { class: prefix$1 + "-submenu-label" }, translate(view, this.options.label || ""));
        let wrap = crel("div", { class: prefix$1 + "-submenu-wrap" }, btn, crel("div", { class: prefix$1 + "-submenu" }, items.dom));
        let listeningOnClose = null;
        let openSubmenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
            markMenuEvent(e);
            setClass(wrap, prefix$1 + "-submenu-wrap-active", true);
            if (!listeningOnClose)
                win.addEventListener("click", listeningOnClose = () => {
                    if (!isMenuEvent(wrap)) {
                        wrap.classList.remove(prefix$1 + "-submenu-wrap-active");
                        win.removeEventListener("click", listeningOnClose);
                        listeningOnClose = null;
                    }
                });
            if (!(e.type == "click" && e.detail)) {
                let focusIndex = findFocusableIndex(this.focusables, -1, 1);
                if (focusIndex != null)
                    this.setFocusIndex(focusIndex);
            }
        };
        btn.addEventListener("click", openSubmenu);
        btn.addEventListener("keydown", e => {
            if (e.key === "ArrowRight")
                openSubmenu(e);
        });
        // Clicking on an item should not remove focus from the editor
        btn.addEventListener("mousedown", e => e.preventDefault());
        items.dom.addEventListener("keydown", (event) => {
            markMenuEvent(event);
            if (keyboardMoveFocus(this, event, "vertical")) ;
            else if (event.key === "Escape" || event.key === "ArrowLeft") {
                event.preventDefault();
                event.stopPropagation();
                setClass(wrap, prefix$1 + "-submenu-wrap-active", false);
                btn.focus();
            }
        });
        items.dom.addEventListener("focusout", () => {
            clearTimeout(this.focusTimeout);
            this.focusTimeout = setTimeout(() => {
                let active = win.document.activeElement;
                if (active && !items.dom.contains(active))
                    wrap.classList.remove(prefix$1 + "-submenu-wrap-active");
            }, 20);
        });
        function update(state) {
            let inner = items.update(state);
            wrap.style.display = inner ? "" : "none";
            return inner;
        }
        return { dom: wrap, update, focusable: btn };
    }
    setFocusIndex(index) {
        if (this.focusables.length <= 1)
            return;
        this.focusables[this.focusIndex].setAttribute("tabindex", "-1");
        this.focusIndex = index;
        let nextFocusItem = this.focusables[index];
        nextFocusItem.setAttribute("tabindex", "0");
        nextFocusItem.focus();
    }
}
/**
Render the given, possibly nested, array of menu elements into a
document fragment, placing separators between them (and ensuring no
superfluous separators appear when some of the groups turn out to
be empty).
*/
function renderGrouped(view, content) {
    let result = document.createDocumentFragment();
    let updates = [], focusables = [], separators = [];
    for (let i = 0; i < content.length; i++) {
        let items = content[i], localUpdates = [], localNodes = [];
        for (let j = 0; j < items.length; j++) {
            let { dom, update, focusable } = items[j].render(view);
            focusables.push(focusable || dom);
            let span = crel("span", { class: prefix$1 + "item" }, dom);
            result.appendChild(span);
            localNodes.push(span);
            localUpdates.push(update);
        }
        if (localUpdates.length) {
            updates.push(combineUpdates(localUpdates, localNodes));
            if (i < content.length - 1)
                separators.push(result.appendChild(separator()));
        }
    }
    function update(state) {
        let something = false, needSep = false;
        for (let i = 0; i < updates.length; i++) {
            let hasContent = updates[i](state);
            if (i)
                separators[i - 1].style.display = needSep && hasContent ? "" : "none";
            needSep = hasContent;
            if (hasContent)
                something = true;
        }
        return something;
    }
    return { dom: result, update, focusables };
}
function separator() {
    return crel("span", { class: prefix$1 + "separator", role: "separator" });
}
/**
A set of basic editor-related icons. Contains the properties
`join`, `lift`, `selectParentNode`, `undo`, `redo`, `strong`, `em`,
`code`, `link`, `bulletList`, `orderedList`, and `blockquote`, each
holding an object that can be used as the `icon` option to
`MenuItem`.
*/
const icons = {
    join: {
        width: 800, height: 900,
        path: "M0 75h800v125h-800z M0 825h800v-125h-800z M250 400h100v-100h100v100h100v100h-100v100h-100v-100h-100z"
    },
    lift: {
        width: 1024, height: 1024,
        path: "M219 310v329q0 7-5 12t-12 5q-8 0-13-5l-164-164q-5-5-5-13t5-13l164-164q5-5 13-5 7 0 12 5t5 12zM1024 749v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12zM1024 530v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 310v109q0 7-5 12t-12 5h-621q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h621q7 0 12 5t5 12zM1024 91v109q0 7-5 12t-12 5h-987q-7 0-12-5t-5-12v-109q0-7 5-12t12-5h987q7 0 12 5t5 12z"
    },
    selectParentNode: { text: "\u2b1a", css: "font-weight: bold" },
    undo: {
        width: 1024, height: 1024,
        path: "M761 1024c113-206 132-520-313-509v253l-384-384 384-384v248c534-13 594 472 313 775z"
    },
    redo: {
        width: 1024, height: 1024,
        path: "M576 248v-248l384 384-384 384v-253c-446-10-427 303-313 509-280-303-221-789 313-775z"
    },
    strong: {
        width: 805, height: 1024,
        path: "M317 869q42 18 80 18 214 0 214-191 0-65-23-102-15-25-35-42t-38-26-46-14-48-6-54-1q-41 0-57 5 0 30-0 90t-0 90q0 4-0 38t-0 55 2 47 6 38zM309 442q24 4 62 4 46 0 81-7t62-25 42-51 14-81q0-40-16-70t-45-46-61-24-70-8q-28 0-74 7 0 28 2 86t2 86q0 15-0 45t-0 45q0 26 0 39zM0 950l1-53q8-2 48-9t60-15q4-6 7-15t4-19 3-18 1-21 0-19v-37q0-561-12-585-2-4-12-8t-25-6-28-4-27-2-17-1l-2-47q56-1 194-6t213-5q13 0 39 0t38 0q40 0 78 7t73 24 61 40 42 59 16 78q0 29-9 54t-22 41-36 32-41 25-48 22q88 20 146 76t58 141q0 57-20 102t-53 74-78 48-93 27-100 8q-25 0-75-1t-75-1q-60 0-175 6t-132 6z"
    },
    em: {
        width: 585, height: 1024,
        path: "M0 949l9-48q3-1 46-12t63-21q16-20 23-57 0-4 35-165t65-310 29-169v-14q-13-7-31-10t-39-4-33-3l10-58q18 1 68 3t85 4 68 1q27 0 56-1t69-4 56-3q-2 22-10 50-17 5-58 16t-62 19q-4 10-8 24t-5 22-4 26-3 24q-15 84-50 239t-44 203q-1 5-7 33t-11 51-9 47-3 32l0 10q9 2 105 17-1 25-9 56-6 0-18 0t-18 0q-16 0-49-5t-49-5q-78-1-117-1-29 0-81 5t-69 6z"
    },
    code: {
        width: 896, height: 1024,
        path: "M608 192l-96 96 224 224-224 224 96 96 288-320-288-320zM288 192l-288 320 288 320 96-96-224-224 224-224-96-96z"
    },
    link: {
        width: 951, height: 1024,
        path: "M832 694q0-22-16-38l-118-118q-16-16-38-16-24 0-41 18 1 1 10 10t12 12 8 10 7 14 2 15q0 22-16 38t-38 16q-8 0-15-2t-14-7-10-8-12-12-10-10q-18 17-18 41 0 22 16 38l117 118q15 15 38 15 22 0 38-14l84-83q16-16 16-38zM430 292q0-22-16-38l-117-118q-16-16-38-16-22 0-38 15l-84 83q-16 16-16 38 0 22 16 38l118 118q15 15 38 15 24 0 41-17-1-1-10-10t-12-12-8-10-7-14-2-15q0-22 16-38t38-16q8 0 15 2t14 7 10 8 12 12 10 10q18-17 18-41zM941 694q0 68-48 116l-84 83q-47 47-116 47-69 0-116-48l-117-118q-47-47-47-116 0-70 50-119l-50-50q-49 50-118 50-68 0-116-48l-118-118q-48-48-48-116t48-116l84-83q47-47 116-47 69 0 116 48l117 118q47 47 47 116 0 70-50 119l50 50q49-50 118-50 68 0 116 48l118 118q48 48 48 116z"
    },
    bulletList: {
        width: 768, height: 896,
        path: "M0 512h128v-128h-128v128zM0 256h128v-128h-128v128zM0 768h128v-128h-128v128zM256 512h512v-128h-512v128zM256 256h512v-128h-512v128zM256 768h512v-128h-512v128z"
    },
    orderedList: {
        width: 768, height: 896,
        path: "M320 512h448v-128h-448v128zM320 768h448v-128h-448v128zM320 128v128h448v-128h-448zM79 384h78v-256h-36l-85 23v50l43-2v185zM189 590c0-36-12-78-96-78-33 0-64 6-83 16l1 66c21-10 42-15 67-15s32 11 32 28c0 26-30 58-110 112v50h192v-67l-91 2c49-30 87-66 87-113l1-1z"
    },
    blockquote: {
        width: 640, height: 896,
        path: "M0 448v256h256v-256h-128c0 0 0-128 128-128v-128c0 0-256 0-256 256zM640 320v-128c0 0-256 0-256 256v256h256v-256h-128c0 0 0-128 128-128z"
    }
};
/**
Menu item for the `joinUp` command.
*/
const joinUpItem = new MenuItem({
    title: "Join with above block",
    run: joinUp,
    select: state => joinUp(state),
    icon: icons.join
});
/**
Menu item for the `lift` command.
*/
const liftItem = new MenuItem({
    title: "Lift out of enclosing block",
    run: lift,
    select: state => lift(state),
    icon: icons.lift
});
/**
Menu item for the `selectParentNode` command.
*/
const selectParentNodeItem = new MenuItem({
    title: "Select parent node",
    run: selectParentNode,
    select: state => selectParentNode(state),
    icon: icons.selectParentNode
});
/**
Menu item for the `undo` command.
*/
let undoItem = new MenuItem({
    title: "Undo last change",
    run: undo,
    enable: state => undo(state),
    icon: icons.undo
});
/**
Menu item for the `redo` command.
*/
let redoItem = new MenuItem({
    title: "Redo last undone change",
    run: redo,
    enable: state => redo(state),
    icon: icons.redo
});
/**
Build a menu item for wrapping the selection in a given node type.
Adds `run` and `select` properties to the ones present in
`options`. `options.attrs` may be an object that provides
attributes for the wrapping node.
*/
function wrapItem(nodeType, options) {
    let passedOptions = {
        run(state, dispatch) {
            return wrapIn(nodeType, options.attrs)(state, dispatch);
        },
        select(state) {
            return wrapIn(nodeType, options.attrs)(state);
        }
    };
    for (let prop in options)
        passedOptions[prop] = options[prop];
    return new MenuItem(passedOptions);
}
/**
Build a menu item for changing the type of the textblock around the
selection to the given type. Provides `run`, `active`, and `select`
properties. Others must be given in `options`. `options.attrs` may
be an object to provide the attributes for the textblock node.
*/
function blockTypeItem(nodeType, options) {
    let command = setBlockType(nodeType, options.attrs);
    let passedOptions = {
        run: command,
        enable(state) { return command(state); },
        active(state) {
            let { $from, to, node } = state.selection;
            if (node)
                return node.hasMarkup(nodeType, options.attrs);
            return to <= $from.end() && $from.parent.hasMarkup(nodeType, options.attrs);
        }
    };
    for (let prop in options)
        passedOptions[prop] = options[prop];
    return new MenuItem(passedOptions);
}
// Work around classList.toggle being broken in IE11
function setClass(dom, cls, on) {
    if (on)
        dom.classList.add(cls);
    else
        dom.classList.remove(cls);
}

const prefix = "ProseMirror-menubar";
function isIOS() {
    if (typeof navigator == "undefined")
        return false;
    let agent = navigator.userAgent;
    return !/Edge\/\d/.test(agent) && /AppleWebKit/.test(agent) && /Mobile\/\w+/.test(agent);
}
/**
A plugin that will place a menu bar above the editor. Note that
this involves wrapping the editor in an additional `<div>`.
*/
function menuBar(options) {
    return new Plugin({
        view(editorView) { return new MenuBarView(editorView, options); }
    });
}
class MenuBarView {
    constructor(editorView, options) {
        this.editorView = editorView;
        this.options = options;
        this.focusables = [];
        this.focusIndex = 0;
        this.spacer = null;
        this.maxHeight = 0;
        this.widthForMaxHeight = 0;
        this.floating = false;
        this.scrollHandler = null;
        this.root = editorView.root;
        this.wrapper = crel("div", { class: prefix + "-wrapper" });
        this.menu = this.wrapper.appendChild(crel("div", { class: prefix, role: "toolbar" }));
        this.menu.className = prefix;
        this.menu.ariaControlsElements = [editorView.dom];
        if (editorView.dom.parentNode)
            editorView.dom.parentNode.replaceChild(this.wrapper, editorView.dom);
        if (options.position === "after") {
            this.wrapper.insertBefore(editorView.dom, this.wrapper.firstChild);
        }
        else {
            this.wrapper.appendChild(editorView.dom);
        }
        let { dom, update, focusables } = renderGrouped(this.editorView, this.options.content);
        this.contentUpdate = update;
        this.focusables = focusables;
        this.menu.appendChild(dom);
        if (options.floating && !isIOS()) {
            this.updateFloat();
            let potentialScrollers = getAllWrapping(this.wrapper);
            this.scrollHandler = (e) => {
                let root = this.editorView.root;
                if (!(root.body || root).contains(this.wrapper))
                    potentialScrollers.forEach(el => el.removeEventListener("scroll", this.scrollHandler));
                else
                    this.updateFloat(e.target.getBoundingClientRect ? e.target : undefined);
            };
            potentialScrollers.forEach(el => el.addEventListener('scroll', this.scrollHandler));
        }
        // update focusIndex on focus change
        for (let i = 0; i < focusables.length; i++) {
            let focusable = focusables[i];
            // set `tabindex` to -1 for all but the first focusable item
            if (i)
                focusable.setAttribute("tabindex", "-1");
            focusable.addEventListener("focus", () => {
                if (this.focusIndex === i)
                    return;
                let prevFocusItem = this.focusables[this.focusIndex];
                prevFocusItem.setAttribute("tabindex", "-1");
                focusable.setAttribute("tabindex", "0");
                this.focusIndex = i;
            });
        }
        this.menu.addEventListener("keydown", (event) => {
            keyboardMoveFocus(this, event, "horizontal");
        });
        this.update();
    }
    setFocusIndex(index) {
        if (this.focusables.length <= 1)
            return;
        this.focusables[this.focusIndex].setAttribute("tabindex", "-1");
        this.focusIndex = index;
        let nextFocusItem = this.focusables[index];
        nextFocusItem.setAttribute("tabindex", "0");
        nextFocusItem.focus();
    }
    update() {
        if (this.editorView.root != this.root) {
            let { dom, update } = renderGrouped(this.editorView, this.options.content);
            this.contentUpdate = update;
            this.menu.replaceChild(dom, this.menu.firstChild);
            this.root = this.editorView.root;
        }
        let active = this.editorView.dom.ownerDocument.activeElement == this.focusables[this.focusIndex];
        this.contentUpdate(this.editorView.state);
        if (active && this.focusables[this.focusIndex].style.display == "none") {
            let next = findFocusableIndex(this.focusables, this.focusIndex, 1);
            if (next != null)
                this.setFocusIndex(next);
        }
        if (this.floating) {
            this.updateScrollCursor();
        }
        else {
            if (this.menu.offsetWidth != this.widthForMaxHeight) {
                this.widthForMaxHeight = this.menu.offsetWidth;
                this.maxHeight = 0;
            }
            if (this.menu.offsetHeight > this.maxHeight) {
                this.maxHeight = this.menu.offsetHeight;
                this.menu.style.minHeight = this.maxHeight + "px";
            }
        }
    }
    updateScrollCursor() {
        let selection = this.editorView.root.getSelection();
        if (!selection.focusNode)
            return;
        let rects = selection.getRangeAt(0).getClientRects();
        let selRect = rects[selectionIsInverted(selection) ? 0 : rects.length - 1];
        if (!selRect)
            return;
        let menuRect = this.menu.getBoundingClientRect();
        if (selRect.top < menuRect.bottom && selRect.bottom > menuRect.top) {
            let scrollable = findWrappingScrollable(this.wrapper);
            if (scrollable)
                scrollable.scrollTop -= (menuRect.bottom - selRect.top);
        }
    }
    updateFloat(scrollAncestor) {
        let parent = this.wrapper, editorRect = parent.getBoundingClientRect(), top = scrollAncestor ? Math.max(0, scrollAncestor.getBoundingClientRect().top) : 0;
        if (this.floating) {
            if (editorRect.top >= top || editorRect.bottom < this.menu.offsetHeight + 10) {
                this.floating = false;
                this.menu.style.position = this.menu.style.left = this.menu.style.top = this.menu.style.width = "";
                this.menu.style.display = "";
                this.spacer.parentNode.removeChild(this.spacer);
                this.spacer = null;
            }
            else {
                let border = (parent.offsetWidth - parent.clientWidth) / 2;
                this.menu.style.left = (editorRect.left + border) + "px";
                this.menu.style.display = editorRect.top > (this.editorView.dom.ownerDocument.defaultView || window).innerHeight
                    ? "none" : "";
                if (scrollAncestor)
                    this.menu.style.top = top + "px";
            }
        }
        else {
            if (editorRect.top < top && editorRect.bottom >= this.menu.offsetHeight + 10) {
                this.floating = true;
                let menuRect = this.menu.getBoundingClientRect();
                this.menu.style.left = menuRect.left + "px";
                this.menu.style.width = menuRect.width + "px";
                if (scrollAncestor)
                    this.menu.style.top = top + "px";
                this.menu.style.position = "fixed";
                this.spacer = crel("div", { class: prefix + "-spacer", style: `height: ${menuRect.height}px` });
                parent.insertBefore(this.spacer, this.menu);
            }
        }
    }
    destroy() {
        if (this.wrapper.parentNode)
            this.wrapper.parentNode.replaceChild(this.editorView.dom, this.wrapper);
    }
}
// Not precise, but close enough
function selectionIsInverted(selection) {
    if (selection.anchorNode == selection.focusNode)
        return selection.anchorOffset > selection.focusOffset;
    return selection.anchorNode.compareDocumentPosition(selection.focusNode) == Node.DOCUMENT_POSITION_FOLLOWING;
}
function findWrappingScrollable(node) {
    for (let cur = node.parentNode; cur; cur = cur.parentNode)
        if (cur.scrollHeight > cur.clientHeight)
            return cur;
}
function getAllWrapping(node) {
    let res = [node.ownerDocument.defaultView || window];
    for (let cur = node.parentNode; cur; cur = cur.parentNode)
        res.push(cur);
    return res;
}

export { Dropdown, DropdownSubmenu, MenuItem, blockTypeItem, icons, joinUpItem, liftItem, menuBar, redoItem, renderGrouped, selectParentNodeItem, undoItem, wrapItem };
