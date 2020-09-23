import React from "react";
import SearchPage from "../page-elements/search-page";
import { Helmet } from "react-helmet";
import dynamic from "../lib/dynamic";
import SharedHead from "../page-elements/shared-head";
import FavIcon from "../img/favicon.ico";

export default function Home(): JSX.Element {
	return (
		<>
			{dynamic(() => (
				<SearchPage />
			))}
			<Helmet>
				<title>Netspeak</title>
				<link rel="icon" href={FavIcon}></link>
				<meta
					name="keywords"
					content="netspeak, common language, dictionary, phrase dictionary, netfreak, net speak, net-speak, net slang, internet slang, net-speak, writing assistant"
				/>
				<meta
					name="description"
					content="Netspeak helps you to search for words you don't know, yet. It is a new kind of dictionary that contains everything that has ever been written on the web."
				/>
				<SharedHead />
			</Helmet>
		</>
	);
}
