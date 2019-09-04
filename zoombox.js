// (c) 2019 Jim Hawkins. MIT licensed, see https://opensource.org/licenses/MIT

import Piece from "./piece.js";

export default class ZoomBox {
    constructor(colour, text) {
        this._colour = colour;
        this._text = text;

        this._left = undefined;
        this._width = undefined;
        this._top = undefined;
        this._bottom = undefined;

        this._excessWidth = 0;

        this._svgGroup = undefined;
        this._svgRect = undefined;
        this._svgText = undefined;

        this._xChange = undefined;
        this._yChange = undefined;

        this._children = [];
    }

    get children() {
        return this._children;
    }

    get left() {
        return this._left;
    }
    set left(left) {
        this._left = left;
        this._update_render();
    }

    get width() {
        return this._width;
    }
    set width(width) {
        this._width = width;
        this.cascade_width();
        this._update_render();
    }
    cascade_width() {
        this._children.forEach(child => child.width = this._width - child.left);
    }

    get excessWidth() {
        return this._excessWidth;
    }
    set excessWidth(excessWidth) {
        this._excessWidth = excessWidth;
        this._update_render();
    }

    get top() {
        return this._top;
    }
    set top(top) {
        this._top = top;
        this._update_render();
    }

    get bottom() {
        return this._bottom;
    }
    set bottom(bottom) {
        this._bottom = bottom;
        this._update_render();
    }

    get height() {
        return this._bottom - this._top;
    }

    get piece() {
        return this._svgGroup;
    }

    setDimensions(left, width, top, bottom) {
        const widthChange = (width !== undefined);
        if (left !== undefined) {
            this._left = left;
        }
        if (widthChange) {
            this._width = width;
        }
        if (top !== undefined) {
            this._top = top;
        }
        if (bottom !== undefined) {
            this._bottom = bottom;
        }
        if (widthChange) {
            this.cascade_width();
        }
        this._update_render();
    }

    render(parentPiece) {
        if (this._svgGroup === undefined) {
            this._svgGroup = new Piece('g');

            if (this._colour !== undefined) {
                this._svgRect = this._svgGroup.create('rect', {
                    "x": 0, "fill": this._colour
                });
            }

            if (this._text !== undefined) {
                this._svgText = this._svgGroup.create('text', {
                    "x": 5, "y": 0, "fill": "black",
                    "alignment-baseline": "middle"
                }, this._text);
            }
        }

        this._update_render();
        if (parentPiece === null) {
            this._svgGroup.remove();
        }
        else {
            parentPiece.add_child(this._svgGroup);
        }
        this._children.forEach(child => child.render(this._svgGroup));
    }

    _update_render() {
        if (!!this._svgGroup) {
            // Use an SVG group <g> element because its translate can be
            // smoothed with a CSS transition, which a <text> element's x and y
            // attributes cannot. TOTH https://stackoverflow.com/a/53452940
            this._svgGroup.node.style.transform = 
                `translate(${this._left}px` +
                `, ${(this._top + this._bottom) / 2}px)`;
            // console.log(this._svgGroup.node.style.transform);
        }
        if (!!this._svgRect) {
            this._svgRect.setAttribute(
                'width', this._width > 0 ? this._width + this.excessWidth : 0);
            this._svgRect.setAttribute('y', (this._top - this._bottom)/2);
            this._svgRect.setAttribute('height', this.height);
        }
        if (!!this._svgText) {
            this._svgText.setAttribute('font-size', `${this.height * 0.9}px`);
        }
    }

    get xChange() {
        return this._xChange;
    }
    set xChange(xChange) {
        this._xChange = xChange;
    }

    get yChange() {
        return this._yChange;
    }
    set yChange(yChange) {
        this._yChange = yChange;
    }
}