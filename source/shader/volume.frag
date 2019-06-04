#version 150
//#extension GL_ARB_shading_language_420pack : require
#extension GL_ARB_explicit_attrib_location : require

#define TASK 10
#define ENABLE_OPACITY_CORRECTION 0
#define ENABLE_LIGHTNING 0
#define ENABLE_SHADOWING 0

in vec3 ray_entry_position;

layout(location = 0) out vec4 FragColor;

uniform mat4 Modelview;

uniform sampler3D volume_texture;
uniform sampler2D transfer_texture;


uniform vec3    camera_location;
uniform float   sampling_distance;
uniform float   sampling_distance_ref;
uniform float   iso_value; // treshold für Nummer 2
// Abstand : Teilen
uniform vec3    max_bounds; //Größe des Volumens
uniform ivec3   volume_dimensions; // wie viele einzelne Datenpunkte man in jeder Richtung hat

uniform vec3    light_position;
uniform vec3    light_ambient_color;
uniform vec3    light_diffuse_color;
uniform vec3    light_specular_color;
uniform float   light_ref_coef;


bool
inside_volume_bounds(const in vec3 sampling_position)
{
    return (   all(greaterThanEqual(sampling_position, vec3(0.0)))
            && all(lessThanEqual(sampling_position, max_bounds)));
}


float
get_sample_data(vec3 in_sampling_pos)
{
    vec3 obj_to_tex = vec3(1.0) / max_bounds;
    return texture(volume_texture, in_sampling_pos * obj_to_tex).r;

}

void main()
{
    /// One step trough the volume
    vec3 ray_increment      = normalize(ray_entry_position - camera_location) * sampling_distance;
    /// Position in Volume
    vec3 sampling_pos       = ray_entry_position + ray_increment;// test, increment just to be sure we are in the volume

    /// Init color of fragment
    vec4 dst = vec4(0.0, 0.0, 0.0, 0.0);

    /// check if we are inside volume
    bool inside_volume = inside_volume_bounds(sampling_pos);

    if (!inside_volume)
    discard;

    #if TASK == 10

    vec4 max_val = vec4(0.0, 0.0, 0.0, 0.0);

    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume)
    {
        // get sample
        float s = get_sample_data(sampling_pos);

        // apply the transfer functions to retrieve color and opacity
        vec4 color = texture(transfer_texture, vec2(s, s));

        // this is the example for maximum intensity projection
        max_val.r = max(color.r, max_val.r);
        max_val.g = max(color.g, max_val.g);
        max_val.b = max(color.b, max_val.b);
        max_val.a = max(color.a, max_val.a);

        // increment the ray sampling position
        sampling_pos  += ray_increment;

        // update the loop termination condition
        inside_volume  = inside_volume_bounds(sampling_pos);
    }

    dst = max_val;
    #endif


    #if TASK == 11
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added

    // --- mit Farbe: ---
    //vec4 ave_val = vec4(0.0, 0.0, 0.0, 0.0);

    // --- mit Dichte: ---
    float ave_val = 0.0f;


    int counter = 0;
    while (inside_volume)
    {
        // im while-Loop Werte "sammeln" für average
        // und mitzählen, wie oft die Schleife läuft, um später dadurch zu teilen
        // get sample
        float s = get_sample_data(sampling_pos);

        // ------- average direkt mit der Farbe berechnen ------
        // apply the transfer functions to retrieve color and opacity
        //vec4 color = texture(transfer_texture, vec2(s, s));

        //ave_val.r += color.r;
        //ave_val.g += color.g;
        //ave_val.b += color.b;
        //ave_val.a += color.a;

        // ------- stattdessen mit der Dichte --------
        ave_val += s;

        // increment the ray sampling position
        sampling_pos  += ray_increment;

        // update the loop termination condition
        inside_volume  = inside_volume_bounds(sampling_pos);
        counter++;
    }
        //hier dann den angesammelten wert durch den counter teilen
        // --- mit direkter Farbe: ---
        //dst = ave_val/counter;

        // --- mit erst Dichte ---
        float tmp = ave_val / counter;
        //wie im Default die Farbe berechnen und zurück geben:
        dst = texture(transfer_texture, vec2(tmp, tmp));

#endif
    
#if TASK == 12 || TASK == 13
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume)
    {
        // get sample
        float s = get_sample_data(sampling_pos);
        if(s >= iso_value){





#if TASK == 13 // Binary Search
        vec3 prev = sampling_pos - ray_increment;
        vec3 now = sampling_pos;
        for(int i = 0; i < 64; i++){
            vec3 mid = (prev + now)/2;
            float smid = get_sample_data(mid);
            if(smid < iso_value){
                prev = mid;
            }else{
                now = mid;
            }
        }
            


#endif //endif von Aufgabe 1.3
#if ENABLE_LIGHTNING == 1 // Add Shading
        IMPLEMENTLIGHT;
#if ENABLE_SHADOWING == 1 // Add Shadows
        IMPLEMENTSHADOW;
#endif
#endif
            dst = vec4(light_diffuse_color, 1.0);
            break;


        }
        // dummy code
        //dst = vec4(light_diffuse_color, 1.0);

        // increment the ray sampling position
        sampling_pos += ray_increment;

        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
    }
#endif  //endif von Aufgab 1.2

#if TASK == 31
    // the traversal loop,
    // termination when the sampling position is outside volume boundarys
    // another termination condition for early ray termination is added
    while (inside_volume)
    {
        // get sample
#if ENABLE_OPACITY_CORRECTION == 1 // Opacity Correction
        IMPLEMENT;
#else
        float s = get_sample_data(sampling_pos);
#endif
        // dummy code
        dst = vec4(light_specular_color, 1.0);

        // increment the ray sampling position
        sampling_pos += ray_increment;

#if ENABLE_LIGHTNING == 1 // Add Shading
        IMPLEMENT;
#endif

        // update the loop termination condition
        inside_volume = inside_volume_bounds(sampling_pos);
    }
#endif 

    // return the calculated color value
    FragColor = dst;
}

