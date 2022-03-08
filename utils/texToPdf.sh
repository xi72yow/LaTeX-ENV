#!/bin/bash
#chmod +x texToPdf.sh
#open Gnome pdf viewer 
gnome-terminal -e "bash -c \"evince Dokument.pdf\""
COUNTER=0
#latex formatierung
for i in *.tex; do
    latexindent --overwrite $i
done

while true; do 
inotifywait --event modify *; 
#make latex to pdf
pdflatex -interaction=nonstopmode Dokument; 
#Literaturverzeichnis
biber Dokument;
#if [ $(($COUNTER%5)) -eq 5 ]
#then
#echo "Hey that\'s nice."
#Literaturverzeichnis
#biber Dokument;
#fi

let COUNTER=COUNTER+1; 
echo $COUNTER;
done