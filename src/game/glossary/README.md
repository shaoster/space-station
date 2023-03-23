This folder is intended to contain human-readable definitions of what stuff actually means in the context of our game.

There should not be any logic or "code" here, only definitions and relationships.


# A note on how I think we should name things

A lot of the terms here are structured like Smurf and SmurfLibrary.

The reason this is the case is so there's an intuitive analogy for the difference between something like a "name" and an "id".

For example, the main character might be named "Dr. Jane Doe Jr.", but in our game logic and conversational shorthand, we might simply use "jane".

The CharacterLibrary, in this example, would register the link between "jane" and the data corresponding to Dr. Jane Doe Jr.

As a result, the shorthand identifier must be unique within that library.

There's no technical reason why we can't have a bar called "The Jane" that's also shorthanded as "jane" except, of course, for human confusion.

Human confusion, however, is a good enough reason to avoid ambiguous names where possible.

To see how this all comes together, check out the [Compendium](Compendium.ts).
