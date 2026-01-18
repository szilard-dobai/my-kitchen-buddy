help me set up my new project. it's called `my-kitchen-buddy` and it's meant to be a web app to help you keep track of cooking recipes from various sources (instagram, tiktok etc). ideally, you'd send the link to the app and it would extract relevant information from it (food name, recipe steps, ingredients, caloric info if present, time to cook, tools needed i.e. oven, blender, stove etc, author, maybe some keyframes etc). then, you'd be able to easily see all recipes you have saved in a standardised format. you'd be able to do basic operations you would expect like create, update and delete. you'd be able to search and filter by various elements (ingredients, cooking time, cooking method etc.).

for v1/proof of concept, we'll keep things basic: small web app with authentication, you provide the URL of the video/post and then see the list of extracted recipes. no filtering, sorting, searching etc. just basic proof of concept.

further down the line, i would like to be able to add some integrations:
- connect your instagram account; share the post with our own instagram account; recipe magically appears in your `my-kitchen-buddy` UI.
- connect your tiktok account; share the post with our own tiktok account; recipe magically appears in your `my-kitchen-buddy` UI.
- if the above is too complicated, connect your whatsapp/telegram account; share the post with our own whatsapp/telegram bot; recipe magically appears in your `my-kitchen-buddy` UI.

about the implementation: i want this to be a nextjs app hosted on vercel to start with. auth can be done with `better-auth`. for database, i want to use mongodb. for the extraction, i believe some AI model will need to be used to make sense of the data - i'm leaning towards OpenAI at the moment. we need to also check out if we can use some in-house APIs (like tiktok for developers, instagram etc) to get at least _some_ data from the posts.

questions/uncertainties:
- can this even be built?
- how do we extract the information from posts? do we need to first download the video? do we need to get a transcript (speech-to-text) of the video?


let's work on the plan together
