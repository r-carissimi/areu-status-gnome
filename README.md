# AREU Status - GNOME Extension
A GNOME extension that displays the number of ambulances out in Lombardy, Italy.
It uses the data available at the [official website](https://www.areu.lombardia.it/web/home/missioni-aat-real-time) of AREU, the agency that coordinates the ambulances in Lombardy, Italy.

Please note that <u>by default</u> the number only refers to ambulances in the **Province of Milan**. You can change the province in extension settings (use the "extensions" app and click on the gear icon, if provided by your distro).



![Extension preview](https://i.imgur.com/jpNg1XF.png)



## Installing

### 1. Download the extension

Install by cloning the repository in a folder called `areustatus@carissimi.eu` in `~/.local/share/gnome-shell/extensions`.  

```shell
git clone https://github.com/r-carissimi/areu-status-gnome ~/.local/share/gnome-shell/extensions/areustatus@carissimi.eu
```



### 2. Reload GNOME Shell

Reload GNOME shell by pressing `ALT+F2` , typing 'r' and pressing `Enter` (or just reboot). 



### 3. Enable the extension

The enable the extension in **GNOME Tweaks** or 

```shell
gnome-extensions enable areustatus@carissimi.eu
```

Done!



## TODO

- [X] Create a menu with all the available data
- [X] Let the user choose the AAT
- [X] Let the user choose the position on the top bar
- [ ] Display an 🚁 helicopter icon when *ELI* is in a mission
