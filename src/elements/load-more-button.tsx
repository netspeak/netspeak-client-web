import React from "react";
import "./load-more-button.scss";

interface Props {
	/**
	 * Whether the button was clicked and the page is currently loading more items.
	 *
	 * If `true`, the button will be disabled as display a loading animation.
	 */
	loading?: boolean;
	onClick: () => void;
}

/**
 * A button that displays an image to load more items.
 *
 * If in a loading state, it will display a small loading animation instead.
 */
export default function LoadMoreButton(props: Props): JSX.Element {
	const className = "LoadMoreButton" + (props.loading ? " loading" : "");

	return (
		<button className={className} disabled={!!props.loading} onClick={props.onClick}>
			<span></span>
		</button>
	);
}
