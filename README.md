# vue-active-view

A custom Vue.js directive for visually updating active navigation link based
on current scroll position.

Only compatible for developing in Node.js environment, for now.

Can be used to add/remove a CSS class to an element when another element is
scrolled in and out of view. Useful e.g. to visually update an active
navigation link. Offers 3 different possible detection methods to be used,
suitable for different needs. **Only supports vertical scrolling.**


## Installation

``` shell
$ npm install vue-active-view
```

## Registering to a Vue instance

``` javascript
    import Vue from 'vue';
    import activeView from 'vue-active-view';

    Vue.directive('active-view', activeView({ className: 'my-active-class' }));
```

## Possible parameters


| Param | Type | Description |
| --- | --- | --- |
| OPTS | <code>Object</code> | Options for the directive. |
| OPTS.className | <code>String</code> | CSS class name to add to the bound element.                                   Defaults to "active-view-link". |
| OPTS.updateDelay | <code>Number</code> | Delay in milliseconds for how long to wait                                   to update the current active element after                                   a scroll event has been fired. Lower values                                   can affect performance especially if                                   the directive is bound to a lot of                                   elements. Defaults to 50. |
| OPTS.method | <code>String</code> | Method for detecting the currently visible                                   content. Possible values are "partial",                                   "screenspace" and "complete". Method                                   "partial" chooses the first content that is                                   partially visible, "screenspace" chooses                                   the first visible content that takes the                                   most vertical screenspace and "complete"                                   chooses the first content that is                                   completely visible. Defaults to "partial". |
| OPTS.advance | <code>Number</code> | When using detection method "partial", how                                   much in advance should the currently active                                   link be switched. A number between 0 and 1.                                   Defaults to 0.2, meaning 20% of vertical                                   screenspace. |
| OPTS.largeEnough | <code>Number</code> | When using detection method "screenspace",                                   How much screenspace an element needs to                                   take before it's considered large enough so                                   no calculation is needed for the rest of                                   the visible elements. A number between 0                                   and 1. Defaults to 0.5, meaning 50% of                                   vertical screenspace. |


## Usage in template

``` html
    <a href="#foo" v-active-view="'foo'">
        Foo
    </a>

    <a href="#bar" v-active-view="'bar'">
        Bar
    </a>
```

The "foo" and "bar" values passed to the directive are unique HTML id's of elements that can be scrolled to. Note that the elements need to exist before the bound element of this directive is inserted into its parent node.

## Development

``` shell
# install dependencies
$ npm install

# generate README
$ npm run readme
```