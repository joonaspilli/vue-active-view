/**
 * A custom Vue.js directive for visually updating active navigation link based
 * on current scroll position.
 *
 * Only compatible for developing in Node.js environment, for now.
 *
 * Can be used to add/remove a CSS class to an element when another element is
 * scrolled in and out of view. Useful e.g. to visually update an active
 * navigation link. Offers 3 different possible detection methods to be used,
 * suitable for different needs. **Only supports vertical scrolling.**
 *
 * @param  {Object} OPTS             Options for the directive.
 * @param  {String} OPTS.className   CSS class name to add to the bound element.
 *                                   Defaults to "active-view-link".
 * @param  {Number} OPTS.updateDelay Delay in milliseconds for how long to wait
 *                                   to update the current active element after
 *                                   a scroll event has been fired. Lower values
 *                                   can affect performance especially if
 *                                   the directive is bound to a lot of
 *                                   elements. Defaults to 50.
 * @param  {String} OPTS.method      Method for detecting the currently visible
 *                                   content. Possible values are "partial",
 *                                   "screenspace" and "complete". Method
 *                                   "partial" chooses the first content that is
 *                                   partially visible, "screenspace" chooses
 *                                   the first visible content that takes the
 *                                   most vertical screenspace and "complete"
 *                                   chooses the first content that is
 *                                   completely visible. Defaults to "partial".
 * @param  {Number} OPTS.advance     When using detection method "partial", how
 *                                   much in advance should the currently active
 *                                   link be switched. A number between 0 and 1.
 *                                   Defaults to 0.2, meaning 20% of vertical
 *                                   screenspace.
 * @param  {Number} OPTS.largeEnough When using detection method "screenspace",
 *                                   How much screenspace an element needs to
 *                                   take before it's considered large enough so
 *                                   no calculation is needed for the rest of
 *                                   the visible elements. A number between 0
 *                                   and 1. Defaults to 0.5, meaning 50% of
 *                                   vertical screenspace.
 * @return {Object}                  A Vue.js directive.
 */
function activeView(OPTS) {

    // Setting up

    OPTS = Object.assign({
        className   : 'active-view-link',
        updateDelay : 50,
        method      : 'partial',
        advance     : 0.2,
        largeEnough : 0.5
    }, OPTS);

    const DETECTION_METHODS = {
        partial     : partiallyVisible,
        screenspace : screenspace,
        complete    : completelyVisible
    };

    const UPDATE_METHOD = DETECTION_METHODS[OPTS.method];

    let isBound       = false;
    let elements      = {};
    let oldActive     = null;
    let scrollTimeout = undefined;

    validateOpts();

/* ########################################################################## */

    /**
     * Used to validate the correctness of passed options and provide feedback
     * when attempting to pass a faulty values.
     *
     * @ignore
     */
    function validateOpts() {
        const PREFIX = '[v-active-view] Invalid option for ';
        const INFIX  = ' Passed option: ';
        const SUFFIX = '.';

        let invalidOpt;
        let err;

        const isString  = (val)     => typeof(val) === 'string';
        const isNumber  = (val)     => !isNaN(parseFloat(val));
        const isBetween = (v, a, b) => v >= a ? (v <= b ? true : false) : false;

        if (!isString(OPTS.className)) {

            invalidOpt = OPTS.className;
            err = '"className". Needs to be a string.';

        } else if (!isNumber(OPTS.updateDelay) || OPTS.updateDelay < 0) {

            invalidOpt = OPTS.updateDelay;
            err = '"updateDelay". Needs to be a number ' +
                  'greater than or equal to 0.';

        } else if (!isString(OPTS.method) ||
                   !DETECTION_METHODS.hasOwnProperty(OPTS.method)) {

            invalidOpt = OPTS.method;
            err = '"className". Needs to be a string of value ' +
                  '"partial", "screenspace" or "complete".';

        } else if (!isNumber(OPTS.advance) || !isBetween(OPTS.advance, 0, 1)) {

            invalidOpt = OPTS.advance;
            err = '"advance". Needs to be a number between 0 and 1.';

        } else if (!isNumber(OPTS.largeEnough) ||
                   !isBetween(OPTS.largeEnough, 0, 1)) {

            invalidOpt = OPTS.largeEnough;
            err = '"largeEnough". Needs to be a number between 0 and 1.';

        }

        if (err) throw new Error(PREFIX + err + INFIX + invalidOpt + SUFFIX);
    }

    /**
     * Used to update the currently active element. This is attached to
     * document's scroll event.
     *
     * @ignore
     */
    function updateActive() {
        window.clearTimeout(scrollTimeout);

        scrollTimeout = window.setTimeout(function() {
            let newActiveLink = UPDATE_METHOD(window.innerHeight);

            if (newActiveLink) {
                if (oldActive) oldActive.classList.remove(OPTS.className);
                newActiveLink.classList.add(OPTS.className);
                oldActive = newActiveLink;
            }

        }, OPTS.updateDelay);
    }

    /**
     * Used to get rect's values used by all different detection methods.
     *
     * @ignore
     * @param  {Object} el         An object containing at least the target
     *                             content element.
     * @param  {Object} el.content Target content element that the viewer can
     *                             scroll to.
     * @return {Object}            An object containing top and bottom values
     *                             of the element.
     */
    function getCommonValues(el) {
        let rect   = el.content.getBoundingClientRect();
        let top    = rect.top;
        let bottom = rect.bottom;

        return {
            top    : top,
            bottom : bottom
        };
    }

    /**
     * Decide the active element based on its partial visibilty. Prefers element
     * bound first.
     *
     * @ignore
     * @param  {Number} wHeight Window inner height.
     * @return {Object}         Bound element considered active or null if
     *                          active has not changed or none are active.
     */
    function partiallyVisible(wHeight) {
        let advance = OPTS.advance * wHeight;

        for (let key in elements) {
            let vals      = getCommonValues(elements[key]);
            let isVisible = vals.top < wHeight &&
                            vals.bottom >= advance;

            if (isVisible) return elements[key].link;
        }

        return null;
    }

    /**
     * Decide the active element based on how much vertical screenspace the
     * target content takes.
     *
     * @ignore
     * @param  {Number}        wHeight Window inner height.
     * @return {(Object|Null)}         Bound element considered active or null
     *                                 if active has not changed or none are
     *                                 active.
     */
    function screenspace(wHeight) {
        let biggestShare  = 0;
        let newActiveLink = null;

        for (let key in elements) {
            let vals   = getCommonValues(elements[key]);
            let height = vals.bottom - vals.top; // rect.height has comp. issues

            if (vals.top > wHeight || vals.bottom < 0) {
                continue; // If not in view
            }

            let topReduction    = vals.top < 0 ? -vals.top : 0;
            let bottomReduction = vals.bottom > wHeight ?
                                  vals.bottom - wHeight : 0;

            let share = (height - topReduction - bottomReduction) / wHeight;

            if (share > biggestShare) {
                biggestShare = share;
                newActiveLink = elements[key].link;
                if (share >= OPTS.largeEnough) break;
            }
        }

        return newActiveLink;
    }

    /**
     * Decide the active element if it is completely visible. Prefers the
     * element bound first.
     *
     * @ignore
     * @param  {Number} wHeight Window inner height.
     * @return {Object}         Bound element considered active or null if
     *                          active has not changed or none are active.
     */
    function completelyVisible(wHeight) {
        for (let key in elements) {
            let vals      = getCommonValues(elements[key]);
            let isVisible = vals.top >= 0 && vals.bottom <= wHeight;

            if (isVisible) return elements[key].link;
        }

        return null;
    }

    /**
     * Used to check if there are any elements currently bound to this
     * directive.
     *
     * @ignore
     */
    function hasBoundElements() {
        for (let key in elements) return true;
        return false;
    }


    /**
     * Return a Vue directive.
     *
     * @ignore
     */
    return {
        inserted: function(el, binding) {
            let contentId = binding.value;

            if (!isBound) {
                document.addEventListener('scroll', updateActive);
                isBound = true;
                updateActive();
            }

            elements[contentId] = {
                link: el,
                content: document.getElementById(contentId)
            };
        },
        unbind: function(el, binding) {
            delete elements[binding.value];

            if (!hasBoundElements()) {
                document.removeEventListener('scroll', updateActive);
                isBound = false;
            }
        }
    };
}

module.exports = activeView;
