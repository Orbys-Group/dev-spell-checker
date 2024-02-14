# Dev spell checker README

![orbys group](https://orbysgroup.com/assets/img/banner_marker_ortografix.png)

Esta es una extensión que creamos por una necesidad, me molestaba el resaltado en mi código y más cuando uso palabras en español para crear mis variables, muchos dirán que las escriba en inglés pero es el mismo tema, solo quería seleccionar un texto y que chequeara mi ortografía, así que usando la API de ChatGPT y un poco de esfuerzo creé esta útil herramienta para mí, espero que podamos seguirla mejorando.

https://marketplace.visualstudio.com/items?itemName=OrbysGroup.dev-spell-checker

## Caracteristicas

* [✔️] - Corrige ortografia en español  
* [✔️] - Guarda las palabras para que cuando vuelvas a buscarlas no llames a la API de ChatGPT.  
* [✔️] - Elimina toda la lista de palabras o una sola desde el panel.  
* [✔️] - Permite configurar la API de Chat GPT  
* [✔️] - Permite configurar entre dos modelos: "gpt-3.5-turbo" y "gpt-4". Por defecto, usa "gpt-3.5-turbo", pero puedes cambiarlo en la configuración de la extensión.  



* [⚠️] - Es más preciso en el modelo "GPT-4".  
* [⚠️] - Sigo afinando el promp, por favor revisar.   
* [⚠️] - En ocasiones regresa la palabra [OK], falta afinar el Promp

## Cambios V 0.0.4

* [✔️] - Panel para administrar correcciones actualizado
* [✔️] - Soporte para inglés y español, que puedes cambiar en la configuración.  
* [✔️] - Agrega el enlace para ir al archivo de corrección.
* [✔️] - Soporte para corregir palabras en local. Ahora primero busca la palabra en la lista antes de usar la IA, esto ahorra en costos.


* [⚠️] - Explorando para agregar el comando de teclado CTRL+Number1, pero lo puedes asignar manualmentedev spell en tus atajos de teclado
* [⚠️] - Mientras que el archivo en el que se corrigio exista y no haya cambiado puedes deshacer ese cambio y no depende del estado del archivo, que es como munciona cualquier editor que te permita usar CTRL-Z

## Futuras funciones

* [✖️] - Sugerir un texto segun el contexto del archivo
* [✖️] - Usar spell-check-lib para sugerencias de palabras del diccionario
* [✖️] - Soporte para mas idiomas

## Capturas

* ### Opciones disponibles
![orbys group](https://orbysgroup.com/assets/ortografix/pic1.png)

* ### Panel de administración
![orbys group](https://orbysgroup.com/assets/ortografix/pic2.png)
## Creditos

* https://gifer.com por el loader cool
* https://www.svgrepo.com por los iconos para la lista de palabras
* Todos los demas repos usados para el desarrollo, date-fns, openai, uuid, webpack, webpack-cli