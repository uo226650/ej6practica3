const percentage = 0.01; //const keyword (ES6)
//TODO Posibilidad de eliminar gastos e ingresos
//TODO Prevenir campos vacíos
//TODO Terminar onblur comportamiento raro. Actualizar Añadir Gasto con respecto a este
//TODO Limpiar Informe para empezar de nuevo (Evitar recargar web)
//TODO gastos validar campos
/**
 * Representa una factura generada por el autónomo.
 * El porcentaje de IVA e IRPF es introducido por el usuario
 */
class Ingreso {

    constructor(descripcion, importe, ivaPorcentaje, irpfPorcentaje, horas) {
        this.descripcion = descripcion;
        this.importe = importe;
        this.horas = horas;
        this.ivaPorcentaje = ivaPorcentaje; //Número entero de 0-100 //TODO exception handling Try/catch(ES3)
        this.irpfPorcentaje = irpfPorcentaje; //Número entero de 0-100
        this.importeBase = this.calcularImporteBase();
        this.iva = this.calcularPorcentaje(ivaPorcentaje);
        this.irpf = this.calcularPorcentaje(irpfPorcentaje);
    }

    calcularPorcentaje(porcentaje) {
        return (this.importeBase * porcentaje * percentage)
    }

    calcularImporteBase() {
        debugger;
        return (this.importe / (1 + this.ivaPorcentaje * percentage - this.irpfPorcentaje * percentage));
    }
}

/**
 * Representa los gastos deducibles que ha generado un autónomo.
 * IVA establecido por el usuario (puede ser fijo, reducido, 0 en el caso de que el gasto se la cuota de autónomos en sí misma)
 * El importe que se introduce corresponde al importe total (con IVA)
 */
class Gasto {

    constructor(descripcion, importe, ivaPorcentaje) {
        this.descripcion = descripcion;
        this.importe = importe;
        this.ivaPorcentaje = ivaPorcentaje;
        this.baseImponible = this.calcularBaseImponible();
        this.ivaDeducible = this.calcularIVADeducible(ivaPorcentaje);
    }

    calcularBaseImponible() {
        return (this.importe / (1 + this.ivaPorcentaje * percentage));
    }

    calcularIVADeducible(ivaPorcentaje) {
        return (this.baseImponible * ivaPorcentaje * percentage);
    }
}

class Informe {


    constructor() {
        this.ingresos = [];
        this.gastos = [];
        this.ivaGenerado = 0;
        this.ivaDeducible = 0;
        this.horasTotales = 0;
        this.irpfRetenido = 0;
        this.ingresoNeto = 0;
        this.saldo = 0; //Representa la estimación de IVA de gastos que no has podido deducir
    }

    /**
     * Ingreso neto = Ingresos + IVA generado - IVA deducible - Gastos
     */
    calcularIngresoNeto() {

        let total = 0; //let keyword (ES6)
        let totalIVA = 0;
        for (let ingreso of this.ingresos) { //Testing for-of ECMAScript statement
            total += ingreso.importe;
        }

        this.gastos.forEach(gasto => { //Testing forEach Array Method (ECMAScript5)
            total -= gasto.importe;             //Testing Arrow Function (ECMAScript6)
        });

        //Calcula el IVA acumulado
        totalIVA = this.ivaGenerado - this.ivaDeducible;
        
        if (totalIVA < 0) { //En caso de tener cantidad de IVA acumulada
            totalIVA = 0;
        }

        this.saldo = totalIVA;

        total += this.ivaDeducible
        total -= this.ivaGenerado
        this.ingresoNeto = total;
        return total;
    }

    actualizarIvaDeducible(gasto) {
        this.ivaDeducible += gasto.ivaDeducible;
    }

    actualizarIvaGenerado(ingreso) {
        this.ivaGenerado += ingreso.iva;
    }

    actualizarHorasTotales(ingreso) {
        this.horasTotales += ingreso.horas;
    }

    actualizarIrpfRetenido(ingreso) {
        this.irpfRetenido += ingreso.irpf;
    }

    añadirGasto(gasto) {
        this.gastos.push(gasto);
        this.actualizarIvaDeducible(gasto);
    }

    añadirIngreso(ingreso) {
        this.ingresos.push(ingreso);
        this.actualizarIvaGenerado(ingreso);
        this.actualizarHorasTotales(ingreso);
        this.actualizarIrpfRetenido(ingreso);
    }

}

/**
 * Recoge la información de la página e
 * inicia los objetos "Gasto", "Ingreso" e
 * "Informe" que se encargan de realizar los 
 * cálculos
 */
class CalculadoraFinanciera {

    constructor(informe) {
        this.informe = informe;
    }

    añadir(){
        debugger;
        var errores = document.getElementsByClassName("error") //Resetea los mensajes de error
        for (var error of errores){
            error.innerHTML = "";
        }
        if (document.getElementById("gasto").checked)
            this.añadirGasto();   
        else if (document.getElementById("ingreso").checked)
            this.añadirIngreso();
        else    
            alert("Selecciona un tipo de registro para añadir");
    }

    /**
     * Comprueba que los datos introducidos por el usuario
     * son correctos. En caso de serlo, se añade el gasto
     * al informe
     */
    añadirGasto() {

        // Recupera los valores introducidos por el usuario
        let descripcion = document.getElementById("descripción").value;
        // Y los valida
        let importe = this.validaNumero("importe");
        if (importe == null)
            return;
        let ivaPorcentaje = this.validaPorcentaje("IVA");
        if (ivaPorcentaje == null)
            return;

        //Crea un nuevo objeto con los valores introducidos por el usuario
        var gasto = new Gasto(descripcion, importe, ivaPorcentaje);
        this.informe.añadirGasto(gasto);

        //Actualizar página
        if(this.informe.gastos.length == 1){//Si es el primer gasto, creo el elemento <ul>
            var elemento = document.createElement("ul"); 
            elemento.setAttribute("id", "listaGastos");
            document.getElementById("gastos").append(elemento);
        }
        var listaGastos = document.getElementById("listaGastos").innerHTML;
        document.getElementById("listaGastos").innerHTML = listaGastos.concat("<li>"+ descripcion + ": " + importe + "</li>");

        //Vacía los campos para nuevo ingreso de datos
        this.resetCampos();
        this.deshabilitar();
    }


    /**
     * Comprueba que los datos introducidos por el usuario
     * son correctos. En caso de serlo, se añade el ingreso
     * al informe
     */
    añadirIngreso() {
        
        //Recupera los valores introducidos por el usuario
        let descripcion = document.getElementById("descripción").value;

        
        let importe = this.validaNumero("importe");
        //if (importe == null)
            //return;
        let ivaPorcentaje = this.validaPorcentaje("IVA");
        //if (ivaPorcentaje == null)
            //return;
        let irpfPorcentaje = this.validaPorcentaje("IRPF");
        //if (irpfPorcentaje == null)
            //return;
        let horas = this.validaNumero("horas");
        //if (horas == null)
            //return;
        /*
        let importe = document.getElementById("importe").value;
        let ivaPorcentaje = document.getElementById("IVA").value;
        let irpfPorcentaje = document.getElementById("IRPF").value;
        let horas = document.getElementById("horas").value*/
        debugger;
        
        if (importe == null || ivaPorcentaje == null ||
            irpfPorcentaje == null || horas == null){
            document.getElementById("errorañadir").innerHTML = "Corrige los campos con errores"
            return; //No añadas el ingreso
        }

        document.getElementById("errorañadir").innerHTML = "";    


        //Crea un nuevo objeto con los valores introducidos por el usuario
        var ingreso = new Ingreso(descripcion, importe, ivaPorcentaje, irpfPorcentaje, horas);
        this.informe.añadirIngreso(ingreso);

        //Actualizar la lista HTML resumen de lo introducido por el usuario
        if(this.informe.ingresos.length == 1){//Si es el primer gasto, creo el elemento <ul>
            var elemento = document.createElement("ul"); 
            elemento.setAttribute("id", "listaIngresos");
            document.getElementById("ingresos").append(elemento);
        }
        var listaIngresos = document.getElementById("listaIngresos").innerHTML;
        document.getElementById("listaIngresos").innerHTML = listaIngresos.concat("<li>"+ descripcion + ": " + importe + "</li>");

        //Vacía los campos para nuevo ingreso de datos
        this.resetCampos();
    }

    /**
     * Extrae el valor de un elemento dado su id
     * y comprueba que su formato corresponde a un número
     * 
     * @param {String} ID del elemento a validar
     * @return Valor del elemento si su formato es correcto
     *          null si el formato no es correcto 
     */
    validaNumero(id){
        let importe = document.getElementById(id).value;
        if(isNaN(importe)|| importe==""){         
            this.mensajeAdvertencia(importe, id);
            return null;
        }
        document.getElementById("error" + id).innerHTML = "";//No mostrar mensaje de error
        return Number(importe);
    }


    /**
     * Extrae el valor de un elemento dado su id
     * y comprueba que su formato corresponde a un porcentaje
     * 
     * @param {String} ID del elemento a validar
     * @return Valor del elemento si su formato es correcto
     *          null si el formato no es correcto 
     */
    validaPorcentaje(id){
        let porcentaje = document.getElementById(id).value;
        if (isNaN(porcentaje) || porcentaje=="" ||
        porcentaje > 100 ||
        porcentaje < 0) {
            this.mensajeAdvertencia(porcentaje, id, "\nDebe ser mayor que 0 y menor que 100, sin símbolo '%'");
            return null;
        }
        document.getElementById("error" + id).innerHTML = "";//No mostrar mensaje de error
        return Number(porcentaje);
    }

    /**
     * Para aumentar la usabilidad de la página, se deshabilitan
     * ciertas funciones no disponibles dependiendo del tipo de registro
     * 
     * Se asume que al registrar gastos el usuario no introduce
     * datos de IRPF ni horas trabajadas, pero sí al introducir ingresos
     */
    deshabilitar(){
        document.getElementById("IRPF").disabled = true;
        document.getElementById("horas").disabled = true;
        document.getElementById("IRPF").placeholder = "No aplica";
        document.getElementById("horas").placeholder = "No aplica";
    }

    habilitar(){
        document.getElementById("IRPF").disabled = false;
        document.getElementById("horas").disabled = false;
        document.getElementById("IRPF").placeholder = "ej. 15";
        document.getElementById("horas").placeholder = "ej. 8";
    }

    /**
     * Muestra en la página HTML el contenido del objeto Informe
     */
    generarInforme() {
        var ingresoNeto = this.informe.calcularIngresoNeto();
        
        var textoInforme = "<ul>"
        textoInforme += "<li>Ingreso neto: " + this.informe.ingresoNeto.toFixed(2); //Number method returning a string containing the specified(2) number of decimals
        textoInforme +="</li><li>Saldo: " + this.informe.saldo.toFixed(2);
        textoInforme +="</li><li>IVA generado: " + this.informe.ivaGenerado.toFixed(2);
        textoInforme +="</li><li>IVA deducible: " + this.informe.ivaDeducible.toFixed(2);
        textoInforme +="</li><li>Horas trabajadas: " + this.informe.horasTotales + "</ul>";
        textoInforme += "<p>Detalle: </p>";
        textoInforme += "<ul>Ingresos: ";
        this.informe.ingresos.forEach(ingreso => {
            
            textoInforme +="</li><li>" + ingreso.descripcion;
            textoInforme +="<ul>";
            textoInforme +="</li><li>Importe Total: " + ingreso.importe;
            textoInforme +="</li><li>Importe Base: " + ingreso.importeBase.toFixed(2);
            textoInforme +="</li><li>IVA: " + ingreso.iva.toFixed(2) + " (" + ingreso.ivaPorcentaje + "%)";
            textoInforme +="</li><li>IRPF: " + ingreso.irpf.toFixed(2) + " (" + ingreso.irpfPorcentaje + "%)";
            textoInforme += "</ul>"; //Cierra detalle ingreso
        });
        textoInforme += "</ul>" //Cerrar lista ingresos
        textoInforme += "<ul>Gastos: ";
        this.informe.gastos.forEach(gasto => {
            
            textoInforme +="</li><li>" + gasto.descripcion;
            textoInforme +="<ul>";
            textoInforme +="</li><li>Importe Total: " + gasto.importe;
            textoInforme +="</li><li>IVA: " + gasto.ivaDeducible.toFixed(2) + " (" + gasto.ivaPorcentaje + "%)";
            textoInforme += "</ul>"; //Cierra detalle gasto
        });
        //document.getElementById("listas").innerHTML = "";
        document.getElementById("informe").innerHTML = textoInforme;
    }

    /**
     * Limpia todos los campos
     */
    resetCampos(){
        var campos = document.getElementsByTagName("input");
        for (let campo of campos){
            campo.value="";
        }
    }

    /**
     * Limpia un campo dado su ID
     * @param {String} id Elemento que se desea limpiar
     */
    resetCampo(id){
        document.getElementById(id).value = "";
    }

    /**
     * Prueba la funcionalidad JavaScript de 
     * número variable de argumentos en una función.
     * 
     * En este caso puede recibir 2 o 3 argumentos
     * @param {string} input Valor erróneo introducido por el usuario
     */
    mensajeAdvertencia(input, campo){
        var mensaje = "El valor introducido ( " + input + " ) en el campo [ " + campo + " ] no es número válido";
        if(typeof arguments[2] !== 'undefined'){
            mensaje += arguments[2];
        }
        //alert(mensaje);
        document.getElementById("error"+campo).innerHTML =mensaje;
    }

}
var calculadora = new CalculadoraFinanciera(new Informe());
/*
//DEBUGGING:

//Ingresos
var ingreso1 = new Ingreso("Música en directo", 547.2, 21, 7, 2);
var ingreso2 = new Ingreso("Grabación música", 228, 21, 7, 2);
var ingreso3 = new Ingreso("Música en la calle", 240, 0, 0, 2);

//Gastos
var gasto1 = new Gasto("Cuota autónomo", 53.99, 0);
var gasto2 = new Gasto("Encerdado arco", 60, 21);
var gasto3 = new Gasto("Almohadilla Everest", 16.64, 21);
var gasto4 = new Gasto("Juego cuerdas", 28, 21);

var informe = new Informe();
informe.añadirIngreso(ingreso1);
informe.añadirIngreso(ingreso2);
informe.añadirIngreso(ingreso3);
informe.añadirGasto(gasto1);
informe.añadirGasto(gasto2);
informe.añadirGasto(gasto3);
informe.añadirGasto(gasto4);
var ingresoNeto = informe.calcularIngresoNeto();
console.log("Ingreso neto: " + ingresoNeto);
console.log("Saldo: " + informe.saldo);
console.log("Iva generado: " + informe.ivaGenerado);
console.log("Iva deducible: " + informe.ivaDeducible);
console.log("Horas trabajadas: " + informe.horasTotales);
informe.ingresos.forEach(ingreso => {
    console.log("***********************")
    console.log("Ingreso: " + ingreso.descripcion);
    console.log("Importe Total: " + ingreso.importe);
    console.log("Importe Base: " + ingreso.importeBase);
    console.log("IVA: " + ingreso.iva + " (" + ingreso.ivaPorcentaje + "%)");
    console.log("IRPF: " + ingreso.irpf + " (" + ingreso.irpfPorcentaje + "%)");
});
informe.gastos.forEach(gasto => {
    console.log("***********************")
    console.log("Gasto: " + gasto.descripcion);
    console.log("Importe Total: " + gasto.importe);
    //console.log("Importe Base: " + ingreso.importeBase);
    console.log("IVA: " + gasto.ivaDeducible + " (" + gasto.ivaPorcentaje + "%)");
    //console.log("IRPF: " + ingreso.irpf + " (" + ingreso.irpfPorcentaje + "%)");
});
*/
